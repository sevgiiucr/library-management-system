'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Book {
  id: string;
  title: string;
  author: string;
  published: number;
  borrowDate: string;
  returnDate: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  profileImageUrl?: string;
  createdAt?: string;
}

export default function Dashboard() {
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<any[]>([]);
  const [completedBooks, setCompletedBooks] = useState<number>(0);
  const [userInfo, setUserInfo] = useState<User>({
    id: '',
    name: '',
    email: '',
    profileImageUrl: undefined
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Client tarafında olup olmadığımızı kontrol et
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      router.push('/');
      return;
    }
    
    // Her zamanki veri yükleme işlemlerine devam et
    setUserToken(token);
    fetchUserProfile(token);
    fetchBorrowedBooks(token);
    fetchFavoriteBooks(token);
    fetchCompletedBooks(token);
  }, [isClient, router]);

  // Token yenileme fonksiyonu - Axios interceptor veya bir middleware
  // kullanarak daha genel bir çözüm oluşturulabilir
  const refreshTokenIfNeeded = async () => {
    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'include' // Cookie'leri dahil et
      });

      if (response.ok) {
        const data = await response.json();
        // Yeni access token'ı localStorage'da sakla
        localStorage.setItem('accessToken', data.accessToken);
        return data.accessToken;
      } else {
        // Token yenilenemezse, oturumu sonlandır
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        router.push('/login');
        return null;
      }
    } catch (error) {
      console.error('Token yenilenirken hata:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      router.push('/login');
      return null;
    }
  };

  // API istekleri için yardımcı fonksiyon
  const fetchWithTokenRefresh = async (url: string, options: RequestInit = {}) => {
    let token = localStorage.getItem('accessToken');
    
    // İlk deneme
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // 401 hatası alırsak (token geçersiz), token'ı yenile ve tekrar dene
    if (response.status === 401) {
      const newToken = await refreshTokenIfNeeded();
      if (!newToken) return null;

      // Yenilenen token ile tekrar dene
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json'
        }
      });
    }

    return response;
  };

  // Kullanıcı profilini API'den al
  const fetchUserProfile = async (token: string) => {
    try {
      if (!token) {
        console.log("Token bulunamadı, kullanıcı girişine yönlendiriliyor");
        router.push('/');
        return;
      }
      
      console.log("Kullanıcı profili API isteği yapılıyor...");
      
      const response = await fetchWithTokenRefresh('/api/auth/me');
      
      if (!response) {
        return; // Token yenileme başarısız, zaten yönlendirme yapıldı
      }
      
      console.log('Kullanıcı profili API yanıt durumu:', response.status);

      if (!response.ok) {
        console.error('Kullanıcı profili getirme hatası:', response.status);
        return;
      }

      const data = await response.json();
      console.log('Kullanıcı profili yanıt verisi:', data);
      
      if (data && data.user) {
        // Kullanıcı bilgilerini güncelle
        setUserInfo(prevInfo => ({
          ...prevInfo,
          name: data.user.name || prevInfo.name,
          email: data.user.email || prevInfo.email,
          profileImageUrl: data.user.profileImageUrl || prevInfo.profileImageUrl,
          createdAt: data.user.createdAt || prevInfo.createdAt
        }));
        
        // LocalStorage'daki kullanıcı bilgilerini güncelle
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            user.createdAt = data.user.createdAt;
            localStorage.setItem('user', JSON.stringify(user));
          }
        } catch (err) {
          console.error('localStorage güncelleme hatası:', err);
        }
      }
    } catch (error) {
      console.error('Kullanıcı profili API hatası:', error);
    }
  };

  // Ödünç alınan kitapları API'den al
  const fetchBorrowedBooks = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        setLoading(false);
        router.push('/');
        return;
      }
      
      console.log("API isteği yapılıyor... Token:", token.substring(0, 15) + "...");
      
      // Önce aktif ödünç endpoint'ini dene
      const response = await fetchWithTokenRefresh('/api/borrows/active');
      
      if (!response) {
        setLoading(false);
        return; // Token yenileme başarısız, zaten yönlendirme yapıldı
      }
      
      console.log('API yanıt durumu:', response.status, response.statusText);

      if (!response.ok) {
        console.log('API yanıtı başarısız, genel ödünç API endpoint\'ini deneniyor');
        // Aktif ödünç endpoint'i başarısız olursa, genel ödünç endpoint'ini dene
        const allBorrowsResponse = await fetchWithTokenRefresh('/api/borrows');
        
        if (!allBorrowsResponse || !allBorrowsResponse.ok) {
          setError("Verileri yüklerken bir hata oluştu");
          setLoading(false);
          return;
        }
        
        const allBorrows = await allBorrowsResponse.json();
        console.log('Tüm ödünçler yanıt verisi:', allBorrows);
        
        // Sadece iade edilmemiş ödünçleri filtrele
        const activeBorrows = allBorrows
          .filter((borrow: any) => !borrow.returnDate)
          .map((borrow: any) => ({
            id: borrow.id,
            title: borrow.book.title,
            author: borrow.book.author,
            published: borrow.book.published || 2024,
            borrowDate: borrow.borrowDate,
            returnDate: borrow.returnDate,
            bookId: borrow.book.id
          }));
        
        if (activeBorrows && activeBorrows.length > 0) {
          setBorrowedBooks(activeBorrows);
          setError(null);
        } else {
          setBorrowedBooks([]);
          setError("Henüz ödünç aldığınız kitap bulunmuyor.");
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('API yanıt verisi:', data);
      
      if (data && Array.isArray(data)) {
        if (data.length > 0) {
          setBorrowedBooks(data);
          setError(null);
        } else {
          setBorrowedBooks([]);
          setError("Henüz ödünç aldığınız kitap bulunmuyor.");
        }
      } else {
        console.error('API geçersiz veri döndü:', data);
        setBorrowedBooks([]);
        setError("API veri formatında hata: Dizi beklendi");
      }
    } catch (error) {
      console.error('API hatası:', error);
      setBorrowedBooks([]);
      setError("API bağlantı hatası: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  // Favori kitapları API'den al
  const fetchFavoriteBooks = async (token: string) => {
    try {
      if (!token) {
        return;
      }
      
      console.log("Favori kitaplar API isteği yapılıyor...");
      
      const response = await fetchWithTokenRefresh('/api/favorites');
      
      if (!response) {
        return; // Token yenileme başarısız, zaten yönlendirme yapıldı
      }
      
      console.log('Favoriler API yanıt durumu:', response.status);

      if (!response.ok) {
        console.error('Favori kitapları getirme hatası:', response.status);
        setFavoriteBooks([]);
        return;
      }

      const data = await response.json();
      console.log('Favori kitaplar yanıt verisi:', data);
      
      if (data && Array.isArray(data) && data.length > 0) {
        setFavoriteBooks(data);
      } else {
        setFavoriteBooks([]);
      }
    } catch (error) {
      console.error('Favori kitaplar API hatası:', error);
      setFavoriteBooks([]);
    }
  };

  // Tamamlanmış ödünç almaları API'den al
  const fetchCompletedBooks = async (token: string) => {
    try {
      if (!token) {
        return;
      }
      
      console.log("Tamamlanmış ödünç alma isteği yapılıyor...");
      
      // Tüm ödünç almaları getir
      const response = await fetchWithTokenRefresh('/api/borrows');
      
      if (!response) {
        return; // Token yenileme başarısız, zaten yönlendirme yapıldı
      }
      
      if (!response.ok) {
        console.error('Ödünç almaları getirme hatası:', response.status);
        return;
      }

      const borrows = await response.json();
      
      // Tamamlanmış (iade edilmiş) ödünç almaları filtrele
      const completed = borrows.filter((borrow: any) => borrow.returnDate !== null);
      setCompletedBooks(completed.length);
    } catch (error) {
      console.error('Tamamlanmış ödünç alma sayısı getirme hatası:', error);
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
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      router.push('/');
      return;
    }
    
    // Verileri yenile
    fetchBorrowedBooks(token);
    fetchFavoriteBooks(token);
    fetchCompletedBooks(token);
    fetchUserProfile(token);
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
            
            {loading ? (
              <div className="dashboard-loading">
                <div className="dashboard-spinner"></div>
                <p>Kitaplar yükleniyor...</p>
              </div>
            ) : borrowedBooks.length > 0 ? (
              <div className="dashboard-books-grid">
                {borrowedBooks.map((book) => (
                  <div key={book.id} className="dashboard-book-card">
                    <h3 className="dashboard-book-title">{book.title}</h3>
                    <div className="dashboard-book-author">{book.author}, {book.published}</div>
                    <div className="dashboard-book-dates">
                      <div>
                        <div className="dashboard-date-label">Alınma Tarihi</div>
                        <div className="dashboard-borrow-date">
                          {new Date(book.borrowDate).toLocaleDateString('tr-TR')}
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
            ) : (
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
            )}
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