'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import '@/app/globals.css';
import { toast, Toaster } from "react-hot-toast";
import { User } from "@/types/user";
import { Book } from "@/types/book";

export default function Dashboard() {
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<any[]>([]);
  const [completedBooks, setCompletedBooks] = useState<number>(0);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<User>({
    id: '',
    name: '',
    email: '',
    profileImageUrl: undefined
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isBooksLoading, setIsBooksLoading] = useState(true);

  // Güncellenmiş useCallback ile fonksiyonlar
  const fetchUserProfile = useCallback(async () => {
    setIsUserLoading(true);
    try {
      // localStorage'dan token alınması
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/signin");
        return;
      }

      // Önce localStorage'dan kullanıcı bilgilerini almayı deneyelim
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUserInfo({
            id: userData.id || '',
            name: userData.name || '',
            email: userData.email || '',
            profileImageUrl: userData.profileImageUrl,
            role: userData.role,
            createdAt: userData.createdAt
          });
          
          // Eğer localStorage'da kullanıcı varsa, profil API isteğine gerek kalmaz
          console.log("Kullanıcı bilgileri localStorage'dan alındı:", userData.name);
          
          // Tamamlanmış kitapları almak için borrows API'sini kullanalım
          await fetchCompletedBorrows(token);
          
          setIsUserLoading(false);
          return;
        } catch (e) {
          console.error("localStorage'daki kullanıcı verisi işlenemedi:", e);
          // Local storage'da hata varsa API isteğine devam et
        }
      }

      // API isteği ile kullanıcı profilini almayı dene
      const response = await fetch("/api/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Oturum süresi doldu, lütfen tekrar giriş yapın");
          localStorage.removeItem("token");
          router.push("/signin");
          return;
        }
        throw new Error("Profil bilgileri alınamadı");
      }

      const data = await response.json();
      setUserInfo(data.user);
      setCompletedBooks(data.completedBooks || 0);
    } catch (error) {
      console.error("Kullanıcı profili alınamadı:", error);
      toast.error("Kullanıcı bilgileri yüklenirken bir hata oluştu");
    } finally {
      setIsUserLoading(false);
    }
  }, [router]);

  const fetchBorrowedBooks = useCallback(async () => {
    setIsBooksLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsBooksLoading(false);
        return;
      }

      // Kullanıcı bilgilerini localStorage'dan al
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        setIsBooksLoading(false);
        return;
      }
      
      console.log("Ödünç kitapları getirme işlemi başlatıldı...");
      
      // Timeout promise oluştur - 15 saniye sonra sonlandır
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Ödünç kitaplar getirilirken zaman aşımı"));
        }, 15000);
      });
      
      // API isteği promise'i
      const fetchPromise = (async () => {
        try {
          // API isteği
          console.log("Active borrows API isteği yapılıyor...");
          const response = await fetch(`/api/borrows/active`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
    
          if (!response.ok) {
            throw new Error(`Ödünç alınan kitaplar alınamadı: ${response.status}`);
          }
    
          console.log("Active borrows API yanıtı alındı");
          const activeBorrows = await response.json();
          console.log(`${activeBorrows.length} aktif ödünç alma kaydı alındı:`, activeBorrows);
          
          if (activeBorrows.length === 0) {
            setBorrowedBooks([]);
            return [];
          }
          
          // Kitap detaylarını getir
          console.log("Kitap detayları getiriliyor...");
          const books = [];
          for (const borrow of activeBorrows) {
            try {
              const bookResponse = await fetch(`/api/books/${borrow.bookId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              
              if (!bookResponse.ok) {
                console.error(`Kitap detayı alınamadı: ${borrow.bookId} - ${bookResponse.status}`);
                continue;
              }
              
              const book = await bookResponse.json();
              books.push({
                ...book,
                borrowDate: borrow.borrowDate,
                dueDate: borrow.dueDate
              });
              
              console.log(`Kitap yüklendi: ${book.title}`);
            } catch (bookError) {
              console.error(`Kitap detayı alınırken hata: ${borrow.bookId}`, bookError);
            }
          }
          
          console.log(`${books.length}/${activeBorrows.length} kitap detayı başarıyla alındı`);
          return books;
        } catch (err) {
          console.error("Fetch promise hatası:", err);
          throw err;
        }
      })();
      
      // Hangisi önce biterse (ya fetch ya da timeout) o işleme alınır
      const books = await Promise.race([fetchPromise, timeoutPromise]);
      
      // Boş döndüyse boş array ile güncelle
      if (!books || !Array.isArray(books)) {
        setBorrowedBooks([]);
      } else {
        setBorrowedBooks(books);
      }
      
      console.log("Ödünç kitapları getirme işlemi tamamlandı");
    } catch (error: any) {
      console.error("Ödünç alınan kitaplar alınamadı:", error);
      toast.error("Kitap bilgileri yüklenirken bir hata oluştu: " + error.message);
      setBorrowedBooks([]); // Hata durumunda boş array atıyoruz
    } finally {
      setIsBooksLoading(false);
    }
  }, []);

  // useEffect bağımlılıkları düzeltildi
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
      fetchBorrowedBooks();
      fetchFavoriteBooks(token);
    }
  }, [fetchUserProfile, fetchBorrowedBooks]);

  // Favori kitapları API'den al
  const fetchFavoriteBooks = async (token: string) => {
    try {
      if (!token) {
        return;
      }
      
      console.log("Favori kitaplar API isteği yapılıyor...");
      
      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Favoriler API yanıt durumu:', response.status);

      if (!response.ok) {
        console.error('Favori kitapları getirme hatası:', response.status);
        setFavoriteBooks([]);
        return;
      }

      const favorites = await response.json();
      console.log('Favori kitaplar yanıt verisi:', favorites);
      
      if (favorites && Array.isArray(favorites) && favorites.length > 0) {
        // Favori kitapların detaylarını al
        const bookPromises = favorites.map((favorite: any) => 
          fetch(`/api/books/${favorite.bookId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          .then(res => {
            if (!res.ok) throw new Error(`Kitap getirilemedi: ${favorite.bookId}`);
            return res.json();
          })
          .then(book => ({
            ...book,
            favoriteId: favorite.id
          }))
          .catch(err => {
            console.error(`Favori kitap detayı alınamadı: ${favorite.bookId}`, err);
            return null;
          })
        );
        
        const books = await Promise.all(bookPromises);
        const validBooks = books.filter(book => book !== null);
        
        console.log(`${validBooks.length} favori kitap detayı alındı`);
        setFavoriteBooks(validBooks);
      } else {
        setFavoriteBooks([]);
      }
    } catch (error) {
      console.error('Favori kitaplar API hatası:', error);
      setFavoriteBooks([]);
    }
  };

  // Tamamlanmış ödünçleri almak için yeni fonksiyon
  const fetchCompletedBorrows = async (token: string) => {
    try {
      const response = await fetch('/api/borrows', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error("Ödünç alma kayıtları alınamadı:", response.status);
        return;
      }
      
      const borrows = await response.json();
      
      // Tamamlanmış (iade edilmiş) ödünç almaları filtrele
      const completed = borrows.filter((borrow: any) => borrow.returnDate !== null);
      setCompletedBooks(completed.length);
    } catch (error) {
      console.error("Tamamlanmış ödünç alma sayısı alınamadı:", error);
    }
  };

  // Profil fotoğrafı yükleme işlevi
  const handleProfilePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      try {
        setUploading(true);
        // Profil fotoğrafını API'ye yükle
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Token bulunamadı');
        }

        const response = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ profileImageUrl: base64String })
        });

        if (!response.ok) {
          throw new Error('Profil güncellenirken bir hata oluştu');
        }

        const data = await response.json();

        // Kullanıcı bilgilerini güncelle
        setUserInfo(prev => ({ ...prev, profileImageUrl: data.user.profileImageUrl }));
        
        // LocalStorage'daki kullanıcı bilgilerini güncelle
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.profileImageUrl = data.user.profileImageUrl;
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (error) {
        console.error('Profil fotoğrafı yüklenirken hata:', error);
        alert('Profil fotoğrafı yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Profil fotoğrafı ekleme düğmesine tıklama işlevi
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  // Kullanıcı adının baş harfini alma
  const getInitials = () => {
    return userInfo.name.charAt(0).toUpperCase();
  };

  // Kullanıcının üyelik tarihini formatlama
  const formatMemberSince = () => {
    if (!userInfo.createdAt) {
      return 'Tarih bilgisi yok';
    }
    
    // API'den gelen createdAt tarihi ISO formatındadır
    try {
      const date = new Date(userInfo.createdAt);
      
      // Geçerli bir tarih mi kontrol et
      if (isNaN(date.getTime())) {
        console.error('Geçersiz tarih formatı:', userInfo.createdAt);
        return 'Geçersiz tarih formatı';
      }
      
      // Türkçe tarih formatı
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Tarih işleme hatası:', error);
      return 'Tarih işlenemedi';
    }
  };

  // Yenileme işlevi
  const handleRefresh = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setLoading(true);
      fetchUserProfile();
      fetchBorrowedBooks();
      fetchFavoriteBooks(token);
    }
  };

  // Yükleme durumunu kontrol eden yardımcı fonksiyon
  const isLoading = isUserLoading || isBooksLoading;
  
  // Bu alan dashboard içinde - ödünç alınan kitaplar bölümünde render edilecek
  const renderBorrowedBooks = () => {
    if (isBooksLoading) {
      return (
        <div className="dashboard-loading">
          <div className="dashboard-spinner"></div>
          <p>Kitaplar yükleniyor... ({borrowedBooks.length} kitap alındı)</p>
        </div>
      );
    }
    
    if (borrowedBooks.length === 0) {
      return (
        <div className="bg-blue-900/10 border border-blue-800/30 rounded-xl p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-blue-800/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-gray-300 text-lg">Henüz ödünç aldığın kitap yok.</p>
          <button 
            onClick={() => router.push('/books')}
            className="mt-4 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 font-medium py-2.5 px-5 rounded-lg border border-blue-800/40 transition-all duration-200"
          >
            Kitapları Keşfet
          </button>
        </div>
      );
    }
    
    return (
      <div className="dashboard-books-grid">
        {borrowedBooks.map((book) => (
          <div key={book.id} className="dashboard-book-card">
            <h3 className="dashboard-book-title">{book.title}</h3>
            <div className="dashboard-book-author">{book.author}, {book.published}</div>
            <div className="dashboard-book-dates">
              <div>
                <div className="dashboard-date-label">Alınma Tarihi</div>
                <div className="dashboard-borrow-date">
                  {book.borrowDate ? new Date(book.borrowDate).toLocaleDateString('tr-TR') : 'Tarih bilgisi yok'}
                </div>
              </div>
              <div>
                <div className="dashboard-date-label">Bitiş Tarihi</div>
                <div className="dashboard-return-date">
                  {book.returnDate 
                    ? new Date(book.returnDate).toLocaleDateString('tr-TR')
                    : "Henüz iade edilmedi"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-main-container">
      {/* Arkaplan Görseli */}
      <div className="dashboard-background">
        <Image
          src="/library1.jpg"
          alt="Kütüphane Görünümü"
          fill
          style={{ objectFit: 'cover', opacity: 0.2 }}
          priority
          quality={100}
        />
      </div>
      
      <div className="dashboard-two-column-layout">
        {/* Sol Panel - Video */}
        <div className="dashboard-video-panel">
          <video
            ref={videoRef}
            className="profile-design-video"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/profile_design.mp4" type="video/mp4" />
          </video>
        </div>
        
        {/* Sağ İçerik */}
        <div className="dashboard-main-content">
          {/* Hero Section */}
          <div className="dashboard-hero">
            <div className="dashboard-hero-content">
              {/* Profil Fotoğrafı */}
              <div className="profile-photo-container" onClick={handlePhotoClick}>
                {userInfo.profileImageUrl ? (
                  <img src={userInfo.profileImageUrl} alt="Profil Fotoğrafı" className="profile-photo" />
                ) : (
                  <div className="profile-photo-placeholder">
                    {getInitials()}
                  </div>
                )}
                <div className="profile-photo-upload">
                  {uploading ? 'Yükleniyor...' : 'Fotoğraf Ekle'}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="profile-photo-input"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  disabled={uploading}
                />
              </div>
              
              {/* Kullanıcı Bilgileri */}
              <div className="dashboard-user-info">
                <h1 className="dashboard-title">
                  Hoş Geldin, {userInfo.name}
                </h1>
                <p className="dashboard-subtitle">
                  Kütüphane yolculuğun <span className="dashboard-highlight">{formatMemberSince()}</span> tarihinde başladı
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="dashboard-stats-grid">
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-number dashboard-stat-blue">{completedBooks}</div>
              <div className="dashboard-stat-label">Okuduğun Kitap</div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-number dashboard-stat-purple">{borrowedBooks.length}</div>
              <div className="dashboard-stat-label">Şu an Sende</div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-number dashboard-stat-violet">{favoriteBooks.length}</div>
              <div className="dashboard-stat-label">Favorilediğin Kitaplar</div>
            </div>
          </div>
          
          {/* Ödünç Alınan Kitaplar */}
          <div className="dashboard-books-section">
            <div className="flex justify-between items-center mb-5">
              <h2 className="dashboard-section-title">Ödünç Aldığın Kitaplar</h2>
              <button
                onClick={handleRefresh}
                className="bg-blue-900/50 hover:bg-blue-800/60 text-blue-200 font-medium py-2 px-4 rounded-lg border border-blue-800/50 transition-all duration-200 flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Yenile
                  </>
                )}
              </button>
            </div>
            
            {error && (
              <div className="bg-red-900/20 border border-red-800/50 p-4 rounded-xl text-center mb-6">
                <p className="text-red-200">{error}</p>
              </div>
            )}
            
            {renderBorrowedBooks()}
          </div>

          {/* Favori Kitaplar Bölümü */}
          <div className="dashboard-books-section mt-12">
            <div className="flex justify-between items-center mb-5">
              <h2 className="dashboard-section-title">Favorilediğin Kitaplar</h2>
            </div>
            
            {favoriteBooks.length > 0 ? (
              <div className="dashboard-books-grid">
                {favoriteBooks.map((book) => (
                  <div key={book.id} className="dashboard-book-card" 
                    onClick={() => router.push(`/books/${book.bookId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {book.imageUrl && (
                      <div className="dashboard-book-image">
                        <img src={book.imageUrl} alt={book.title} />
                      </div>
                    )}
                    <h3 className="dashboard-book-title">{book.title}</h3>
                    <div className="dashboard-book-author">{book.author}, {book.published}</div>
                    <div className="absolute top-2 right-2">
                      <svg width="20" height="20" fill="red" viewBox="0 0 24 24" stroke="red" strokeWidth="1">
                        <path strokeLinecap="round" strokeLinejoin="round" 
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-blue-900/10 border border-blue-800/30 rounded-xl p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-blue-800/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <p className="text-gray-300 text-lg">Henüz favori kitabın yok.</p>
                <button 
                  onClick={() => router.push('/books')}
                  className="mt-4 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 font-medium py-2.5 px-5 rounded-lg border border-blue-800/40 transition-all duration-200"
                >
                  Kitapları Keşfet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 