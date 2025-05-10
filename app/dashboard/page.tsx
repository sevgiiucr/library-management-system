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
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isBooksLoading, setIsBooksLoading] = useState(true);

<<<<<<< HEAD
  // Client tarafında olup olmadığımızı kontrol et
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Client tarafında olmadan localStorage'a erişmeye çalışma
    if (!isClient) return;
    
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      // Token yoksa, kullanıcıyı ana sayfaya yönlendir
      console.log("Dashboard: Oturum bulunmuyor, ana sayfaya yönlendiriliyor");
      router.replace('/'); // replace kullan, push yerine
      return;
    }
    
    console.log("Dashboard: Oturum açık, token:", token.substring(0, 10) + "...");
    
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
        router.push('/app/page.tsx');
        return null;
      }
    } catch (error) {
      console.error('Token yenilenirken hata:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      router.push('/app/page.tsx');
      return null;
=======
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
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
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
      
<<<<<<< HEAD
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
=======
      // Timeout promise oluştur - 15 saniye sonra sonlandır
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Ödünç kitaplar getirilirken zaman aşımı"));
        }, 15000);
      });
      
      // API isteği promise'i
      const fetchPromise = (async () => {
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
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
      
<<<<<<< HEAD
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
        
        console.log('Aktif ödünç sayısı (/api/borrows yoluyla):', activeBorrows.length);
        
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

      let data;
      try {
        const responseText = await response.text();
        console.log('API ham yanıt verisi:', responseText.substring(0, 100) + '...');
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON ayrıştırma hatası:', parseError);
        setError("Sunucu yanıtı işlenirken bir hata oluştu");
        setLoading(false);
        return;
      }
      
      console.log('API yanıt verisi:', data);
      console.log('Veri tipi:', typeof data, Array.isArray(data) ? 'array' : 'not array');
      console.log('Veri uzunluğu:', Array.isArray(data) ? data.length : 'N/A');
      
      if (data && Array.isArray(data)) {
        if (data.length > 0) {
          console.log('Alınan ilk kitap örneği:', data[0]);
          setBorrowedBooks(data);
          setError(null);
        } else {
          console.log('API kitap döndürdü ama liste boş');
          setBorrowedBooks([]);
          setError("Henüz ödünç aldığınız kitap bulunmuyor.");
        }
      } else {
        console.error('API geçersiz veri döndü:', data);
        setBorrowedBooks([]);
        setError("API veri formatında hata: Dizi beklendi");
=======
      // Boş döndüyse boş array ile güncelle
      if (!books || !Array.isArray(books)) {
        setBorrowedBooks([]);
      } else {
        setBorrowedBooks(books);
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
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
      
<<<<<<< HEAD
      const response = await fetchWithTokenRefresh('/api/favorites');
      
      if (!response) {
        return; // Token yenileme başarısız, zaten yönlendirme yapıldı
      }
=======
      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
      
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
<<<<<<< HEAD
      if (!token) {
        return;
      }
      
      console.log("Tamamlanmış ödünç alma isteği yapılıyor...");
      
      // Tüm ödünç almaları getir
      const response = await fetchWithTokenRefresh('/api/borrows');
      
      if (!response) {
        return; // Token yenileme başarısız, zaten yönlendirme yapıldı
      }
=======
      const response = await fetch('/api/borrows', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
      
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
<<<<<<< HEAD
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      router.push('/');
      return;
=======
    const token = localStorage.getItem('token');
    if (token) {
      setLoading(true);
      fetchUserProfile();
      fetchBorrowedBooks();
      fetchFavoriteBooks(token);
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
    }
    
    // Verileri yenile
    fetchBorrowedBooks(token);
    fetchFavoriteBooks(token);
    fetchCompletedBooks(token);
    fetchUserProfile(token);
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  backgroundColor: 'transparent',
                  color: '#a1a1aa',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  transition: 'all 0.2s ease',
                  cursor: loading ? 'wait' : 'pointer'
                }}
                disabled={loading}
                title="Yenile"
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                    e.currentTarget.style.color = '#60a5fa';
                    e.currentTarget.style.transform = 'rotate(30deg)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#a1a1aa';
                    e.currentTarget.style.transform = 'rotate(0deg)';
                  }
                }}
              >
                {loading ? (
                  <div 
                    style={{ 
                      width: '16px', 
                      height: '16px', 
                      borderRadius: '50%', 
                      border: '2px solid currentColor', 
                      borderTopColor: 'transparent', 
                      animation: 'spin 0.75s linear infinite' 
                    }}
                  />
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
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