'use client';

import React, { useState, CSSProperties, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookDetailClientProps, FavoriteStatus, Book, OpenLibraryBook } from "../interfaces/book";
import AddToFavorite from "./AddToFavorite";
import BorrowBook from "./BorrowBook";
import toast from "react-hot-toast";

/**
 * Kitap Detay Client Bileşeni
 * Kitap bilgilerini gösterir ve etkileşimli özellikleri sağlar
 */
export default function BookDetailClient({ 
  book, 
  bookId,
  source = 'local' 
}: BookDetailClientProps) {
  const router = useRouter();
  const [favoriteStatus, setFavoriteStatus] = useState<FavoriteStatus>({
    isFavorite: !!book.isFavorite,
    favoriteId: book.favoriteId
  });
  
  const isOpenLibrary = source === 'openLibrary';
  const isLocalBook = source === 'local';

  // State tanımlamaları - Book tipini kullanmak için güvenli dönüşüm
  const [bookData, setBookData] = useState<Book>({
    ...(book as any),
    id: (book as any).id || bookId || '', // OpenLibrary kitapları için bookId kullanılır
    available: book.available ?? true
  });
  
  const [isBorrowing, setIsBorrowing] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>({
    id: '',
    name: '',
    email: ''
  });
  const [userToken, setUserToken] = useState<string | null>(null);

  // LocalStorage'dan kullanıcı bilgilerini al
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      
      if (userStr && token) {
        try {
          const user = JSON.parse(userStr);
          
          setCurrentUser({
            id: user.id || '',
            name: user.name || 'Misafir Kullanıcı',
            email: user.email || ''
          });
          setUserToken(token);
          
          // Yerel kitap ise favori durumunu kontrol et
          if (isLocalBook && (book as Book).id) {
            checkFavoriteStatus(token, (book as Book).id);
          }
        } catch (error) {
          console.error('Kullanıcı bilgileri alınamadı:', error);
        }
      }
    } catch (error) {
      console.error("useEffect içinde hata:", error);
    }
  }, [router, book, isLocalBook]);
  
  // Favori durumunu kontrol et
  const checkFavoriteStatus = async (token: string, bookId: string) => {
    try {
      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const responseText = await response.text();
        
        let favorites;
        try {
          favorites = JSON.parse(responseText);
        } catch (e) {
          console.error("JSON parse hatası:", e);
          return;
        }
        
        if (Array.isArray(favorites)) {
          const favorite = favorites.find(fav => fav.bookId === bookId);
          if (favorite) {
            setFavoriteStatus({
              isFavorite: true,
              favoriteId: favorite.id
            });
          } else {
            setFavoriteStatus({
              isFavorite: false,
              favoriteId: undefined
            });
          }
        }
      }
    } catch (error) {
      console.error("Favori durumu kontrol hatası:", error);
    }
  };
  
  // Kullanıcının favorilerini kontrol et (OpenLibrary kitapları için)
  useEffect(() => {
    if (isOpenLibrary && bookId) {
      const checkFavoriteStatus = async () => {
        try {
          const response = await fetch(`/api/favorites/check?externalId=${bookId}`);
          if (response.ok) {
            const data = await response.json();
            setFavoriteStatus({
              isFavorite: data.isFavorite,
              favoriteId: data.favoriteId
            });
          }
        } catch (error) {
          console.error("Favori durumu kontrol edilemedi:", error);
        }
      };
      
      checkFavoriteStatus();
    }
  }, [isOpenLibrary, bookId]);

  const handleAddToFavorites = async () => {
    if (!isOpenLibrary && !isLocalBook) return;
    
    try {
      if (favoriteStatus.isFavorite) {
        // Favorilerden çıkar
        if (favoriteStatus.favoriteId) {
          const response = await fetch(`/api/favorites/${favoriteStatus.favoriteId}`, {
            method: "DELETE",
          });
          
          if (response.ok) {
            setFavoriteStatus({ isFavorite: false });
            toast.success("Favorilerden çıkarıldı");
            if (isLocalBook) router.refresh();
          } else {
            toast.error("Favorilerden çıkarılamadı");
          }
        }
      } else {
        // Favorilere ekle
        const payload = isOpenLibrary 
          ? { 
              externalId: bookId,
              title: book.title,
              author: book.author,
              published: book.published,
              imageUrl: book.imageUrl
            }
          : { bookId: (book as Book).id };
        
        const endpoint = isOpenLibrary ? "/api/favorites/external" : "/api/favorites";
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        
        if (response.ok) {
          const data = await response.json();
          setFavoriteStatus({ 
            isFavorite: true,
            favoriteId: data.id 
          });
          toast.success("Favorilere eklendi");
          if (isLocalBook) router.refresh();
        } else {
          toast.error("Favorilere eklenemedi");
        }
      }
    } catch (error) {
      console.error("Favori işlemi başarısız:", error);
      toast.error("Bir hata oluştu, lütfen tekrar deneyin");
    }
  };

  // JWT'den userId çekmek için yardımcı fonksiyon
  function getUserIdFromToken(token: string | null): string | null {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch {
      return null;
    }
  }

  // Kitabı ödünç alma işlemi
  const handleBorrowBook = async () => {
    if (!userToken) {
      setActionMessage('Kitap ödünç almak için giriş yapmalısınız');
      setMessageType('error');
      return;
    }

    setIsBorrowing(true);
    setActionMessage(null);

    const userId = getUserIdFromToken(userToken);
    if (!userId) {
      setActionMessage('Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.');
      setMessageType('error');
      setIsBorrowing(false);
      return;
    }

    try {
      const response = await fetch(`/api/books/${bookData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          action: 'borrow',
          userId
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Kitap ödünç alınırken bir hata oluştu');
      }

      // Update local state (güvenli id alma)
      const borrowId = responseData.borrow?.id || responseData.id || '';
      setBookData({
        ...bookData,
        available: false,
        currentBorrow: {
          id: borrowId,
          userId: currentUser.id,
          borrowDate: new Date().toISOString(),
          user: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email
          }
        }
      });

      setActionMessage('Kitap başarıyla ödünç alındı!');
      setMessageType('success');

      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err: any) {
      console.error('Kitap ödünç alma hatası:', err);
      setActionMessage(err.message || 'Kitap ödünç alınırken bir hata oluştu');
      setMessageType('error');
    } finally {
      setIsBorrowing(false);
    }
  };
  
  // Kitabı iade etme işlemi
  const handleReturnBook = async () => {
    if (!userToken) {
      setActionMessage('Kitap iade etmek için giriş yapmalısınız');
      setMessageType('error');
      return;
    }

    setIsBorrowing(true);
    setActionMessage(null);

    const userId = getUserIdFromToken(userToken);
    if (!userId) {
      setActionMessage('Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.');
      setMessageType('error');
      setIsBorrowing(false);
      return;
    }

    try {
      const response = await fetch(`/api/books/${bookData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          action: 'return',
          userId
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Kitap iade edilirken bir hata oluştu');
      }

      // Update local state
      setBookData({
        ...bookData,
        available: true,
        currentBorrow: null
      });

      setActionMessage('Kitap başarıyla iade edildi!');
      setMessageType('success');

      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err: any) {
      console.error('Kitap iade hatası:', err);
      setActionMessage(err.message || 'Kitap iade edilirken bir hata oluştu');
      setMessageType('error');
    } finally {
      setIsBorrowing(false);
    }
  };
  
  // Kitaplar sayfasına dönüş
  const handleBackToBooks = () => {
    router.push('/books');
  };
  
  // Container stili
  const containerStyle: CSSProperties = {
    minHeight: '100vh',
    color: 'white',
    position: 'relative',
  };
  
  // Arkaplan stili
  const backgroundStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'url("/library1.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: 0.15,
    zIndex: 1,
  };
  
  // İçerik stili
  const contentStyle: CSSProperties = {
    position: 'relative',
    zIndex: 2,
    padding: '7rem 1rem 2rem',
    maxWidth: '800px',
    margin: '0 auto',
  };
  
  // Başlık stili
  const titleStyle: CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: 'white',
  };
  
  // Yazar stili
  const authorStyle: CSSProperties = {
    fontSize: '1.25rem',
    color: '#d1d5db',
    marginBottom: '1.5rem',
  };
  
  // Bilgi container stili
  const infoContainerStyle: CSSProperties = {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: '8px',
    padding: '2rem',
    marginBottom: '2rem',
    backdropFilter: 'blur(8px)',
  };
  
  // Bilgi satırı stili
  const infoRowStyle: CSSProperties = {
    display: 'flex',
    marginBottom: '1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '0.75rem',
  };
  
  // Bilgi etiketi stili
  const infoLabelStyle: CSSProperties = {
    width: '150px',
    fontWeight: 'bold',
    color: '#9ca3af',
  };
  
  // Bilgi değeri stili
  const infoValueStyle: CSSProperties = {
    flex: 1,
    color: 'white',
  };
  
  // Buton konteyneri stili
  const buttonContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
  };
  
  // Buton stili
  const buttonStyle: CSSProperties = {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  };
  
  // İkincil buton stili
  const secondaryButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  };
  
  // Kitap durumu stili
  const getStatusStyle = (isAvailable: boolean): CSSProperties => ({
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    backgroundColor: isAvailable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
    color: isAvailable ? '#10b981' : '#ef4444',
  });
  
  // Mesaj kutusu stili
  const getMessageBoxStyle = (type: 'success' | 'error'): CSSProperties => ({
    padding: '1rem',
    marginBottom: '1.5rem',
    borderRadius: '8px',
    backgroundColor: type === 'success' 
      ? 'rgba(16, 185, 129, 0.2)' 
      : 'rgba(239, 68, 68, 0.2)',
    color: type === 'success' ? '#10b981' : '#ef4444',
  });

  return (
    <div style={containerStyle}>
      <div style={backgroundStyle} />
      
      <div style={contentStyle}>
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <button 
                onClick={handleBackToBooks}
                style={{
                  ...secondaryButtonStyle,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '2rem'
                }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kitaplar Sayfasına Dön
              </button>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                {/* Kitap kapak resmi bölümü */}
                {bookData.imageUrl && (
                  <div style={{ 
                    width: '36%',
                    height: '430px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    position: 'relative'
                  }}>
                    <img 
                      src={bookData.imageUrl} 
                      alt={bookData.title}
                      style={{ 
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }} 
                    />
                  </div>
                )}
                
                {/* Kitap bilgileri bölümü */}
                <div style={{ flex: '1', minWidth: '300px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h1 style={titleStyle}>{bookData.title}</h1>
                    
                    {/* Favori butonu */}
                    <AddToFavorite 
                      isFavorite={favoriteStatus.isFavorite} 
                      onClick={handleAddToFavorites} 
                    />
                  </div>
                  
                  <p style={authorStyle}>{bookData.author}</p>
                  
                  <div style={infoContainerStyle}>
                    <div style={infoRowStyle}>
                      <span style={infoLabelStyle}>Durum</span>
                      <span style={infoValueStyle}>
                        <span style={getStatusStyle(bookData.available)}>
                          {bookData.available ? 'Müsait' : 'Ödünç Alındı'}
                        </span>
                      </span>
                    </div>
                    
                    <div style={infoRowStyle}>
                      <span style={infoLabelStyle}>Yayın Yılı</span>
                      <span style={infoValueStyle}>{bookData.published}</span>
                    </div>
                    
                    {!bookData.available && bookData.currentBorrow && (
                      <div style={infoRowStyle}>
                        <span style={infoLabelStyle}>Ödünç Alan</span>
                        <span style={infoValueStyle}>{bookData.currentBorrow.user.name}</span>
                      </div>
                    )}
                    
                    {!bookData.available && bookData.currentBorrow && (
                      <div style={infoRowStyle}>
                        <span style={infoLabelStyle}>Ödünç Alma Tarihi</span>
                        <span style={infoValueStyle}>
                          {new Date(bookData.currentBorrow.borrowDate).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Kitap işlem butonları */}
                  <div style={buttonContainerStyle}>
                    {isLocalBook && (
                      <BorrowBook 
                        bookId={bookData.id}
                        isAvailable={bookData.available}
                        currentBorrow={bookData.currentBorrow}
                      />
                    )}
                    
                    {isOpenLibrary && (
                      <a
                        href={`https://openlibrary.org/works/${bookId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        Open Library'de Görüntüle
                      </a>
                    )}
                  </div>
                  
                  {/* İşlem mesajı */}
                  {actionMessage && messageType && (
                    <div style={getMessageBoxStyle(messageType)}>
                      <p>{actionMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 