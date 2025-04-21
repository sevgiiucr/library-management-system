'use client';

import React, { useState, CSSProperties, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Kitap tipi
interface Book {
  id: string;
  title: string;
  author: string;
  published: number;
  available: boolean;
  imageUrl?: string;
  currentBorrow?: {
    id: string;
    userId: string;
    borrowDate: string;
    user: {
      id: string;
      name: string;
      email: string;
    }
  } | null;
}

// Props tipi
interface BookDetailClientProps {
  book: Book;
}

/**
 * Kitap Detay Client Bileşeni
 * Kitap bilgilerini gösterir ve etkileşimli özellikleri sağlar
 */
export default function BookDetailClient({ book }: BookDetailClientProps) {
  // Router
  const router = useRouter();

  // State tanımlamaları
  const [bookData, setBookData] = useState<Book>(book);
  const [isBorrowing, setIsBorrowing] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>({
    id: '',
    name: '',
    email: ''
  });

  // LocalStorage'dan kullanıcı bilgilerini al
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser({
          id: user.id || '',
          name: user.name || 'Misafir Kullanıcı',
          email: user.email || ''
        });
      } catch (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error);
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  // Kitabı ödünç alma işlemi
  const handleBorrowBook = async () => {
    try {
      if (!bookData || !bookData.available) return;
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      setIsBorrowing(true);
      setActionMessage(null);
      setMessageType(null);
      
      console.log(`Kitap ödünç alma işlemi başlatılıyor: ID=${bookData.id}, User=${currentUser.id}`);
      
      const response = await fetch(`/api/books/${bookData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'borrow',
          userId: currentUser.id
        }),
      });
      
      console.log('Ödünç alma yanıtı:', response.status, response.statusText);
      
      // Yanıtı tek seferde JSON'a dönüştür ve sakla
      const responseData = await response.json();
      console.log('Ödünç alma yanıt verisi:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Kitap ödünç alınırken bir hata oluştu');
      }
      
      // Ödünç alma kaydının ID'sini doğru şekilde al
      const borrowId = responseData.borrowId || 'temp-id';
      console.log('Oluşturulan ödünç ID:', borrowId);
      
      // Başarılı yanıtta, response.json() yerine zaten parse edilmiş responseData kullan
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
            email: currentUser.email || ''
          }
        }
      });
      
      setActionMessage('Kitap başarıyla ödünç alındı!');
      setMessageType('success');
      
      // Veritabanının güncellenebilmesi için daha uzun bir bekleme süresi
      setTimeout(() => {
        console.log('Dashboard sayfasına yönlendiriliyor...');
        router.push('/dashboard');
      }, 5000);
      
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
    try {
      if (!bookData || bookData.available) return;
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Kullanıcı sadece kendi ödünç aldığı kitabı iade edebilir
      if (bookData.currentBorrow?.userId !== currentUser.id) {
        setActionMessage('Sadece kitabı ödünç alan kullanıcı iade edebilir');
        setMessageType('error');
        return;
      }
      
      setIsBorrowing(true);
      setActionMessage(null);
      setMessageType(null);
      
      console.log(`Kitap iade işlemi başlatılıyor: ID=${bookData.id}, User=${currentUser.id}`);
      
      const response = await fetch(`/api/books/${bookData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'return'
        }),
      });
      
      console.log('İade yanıtı:', response.status, response.statusText);
      
      // Yanıtı tek seferde JSON'a dönüştür ve sakla
      const responseData = await response.json();
      console.log('İade yanıt verisi:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Kitap iade edilirken bir hata oluştu');
      }
      
      // Başarılı yanıtta, response.json() yerine zaten parse edilmiş responseData kullan
      setBookData({
        ...bookData,
        available: true,
        currentBorrow: null
      });
      
      setActionMessage('Kitap başarıyla iade edildi!');
      setMessageType('success');
      
      // Veritabanının güncellenebilmesi için daha uzun bir bekleme süresi
      setTimeout(() => {
        console.log('Dashboard sayfasına yönlendiriliyor...');
        router.push('/dashboard');
      }, 5000);
      
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
    backgroundColor: 'black',
    color: 'white',
    position: 'relative',
  };
  
  // Arkaplan gradient stili
  const backgroundStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle at 30% 50%, rgba(30, 58, 138, 0.15) 0%, rgba(0, 0, 0, 0.95) 100%)',
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
                    width: '250px',
                    maxWidth: '100%',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  }}>
                    <img 
                      src={bookData.imageUrl} 
                      alt={bookData.title}
                      style={{ 
                        width: '100%', 
                        height: '350px', 
                        objectFit: 'cover' 
                      }} 
                    />
                  </div>
                )}
                
                {/* Kitap bilgileri bölümü */}
                <div style={{ flex: '1', minWidth: '300px' }}>
                  <h1 style={titleStyle}>{bookData.title}</h1>
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
                    {bookData.available ? (
                      <button 
                        onClick={handleBorrowBook}
                        disabled={isBorrowing}
                        style={{
                          ...buttonStyle,
                          opacity: isBorrowing ? 0.7 : 1,
                        }}
                      >
                        {isBorrowing ? 'İşlem yapılıyor...' : 'Ödünç Al'}
                      </button>
                    ) : bookData.currentBorrow?.userId === currentUser.id ? (
                      <button 
                        onClick={handleReturnBook}
                        disabled={isBorrowing}
                        style={{
                          ...buttonStyle,
                          backgroundColor: 'rgba(16, 185, 129, 0.8)',
                          opacity: isBorrowing ? 0.7 : 1,
                        }}
                      >
                        {isBorrowing ? 'İşlem yapılıyor...' : 'İade Et'}
                      </button>
                    ) : null}
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