'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Image from 'next/image';

interface Book {
  id: string;
  title: string;
  author: string;
  published: number;
  available: boolean;
  imageUrl?: string;
  isFavorite?: boolean;
  favoriteId?: string;
  categories: string[];
}

// Kategorileri tanımla - Bu artık veritabanından gelecek
const defaultCategories = [
  { id: 'all', name: 'Tüm Kitaplar' },
  { id: 'fiction', name: 'Kurgu' },
  { id: 'nonfiction', name: 'Bilim ve Eğitim' },
  { id: 'classics', name: 'Klasikler' },
  { id: 'mystery', name: 'Polisiye' },
  { id: 'biography', name: 'Biyografi' },
  { id: 'history', name: 'Tarih' }
];

// Global stillerimizi en üstte tanımlayalım
function GlobalStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;800&display=swap');
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes fadeIn {
        0% { opacity: 0; transform: translateY(-10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes glow {
        0% { text-shadow: 0 0 10px rgba(142, 197, 252, 0.3); }
        50% { text-shadow: 0 0 20px rgba(142, 197, 252, 0.5), 0 0 30px rgba(224, 195, 252, 0.3); }
        100% { text-shadow: 0 0 10px rgba(142, 197, 252, 0.3); }
      }
      
      .book-card:hover .favorite-tooltip {
        opacity: 1;
      }

      .category-item {
        cursor: pointer;
        padding: 0.75rem 1.25rem;
        border-radius: 9999px;
        transition: all 0.3s ease;
        font-weight: 500;
        font-size: 0.875rem;
        background-color: rgba(30, 41, 59, 0.5);
        color: rgba(255, 255, 255, 0.8);
      }

      .category-item:hover {
        background-color: rgba(59, 130, 246, 0.5);
        transform: translateY(-2px);
      }

      .category-item-active {
        background-color: rgb(59, 130, 246);
        color: white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
      }
    `}</style>
  );
}

// SearchParams hook'unu ayrı bir bileşene çıkaralım
function BooksContent() {
  const searchParams = useSearchParams();
  const urlSearchTerm = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'all';

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(urlSearchTerm);
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [categories, setCategories] = useState([...defaultCategories]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info' | null}>({message: '', type: null});
  const router = useRouter();
  const pathname = usePathname();

  // Bildirim gösterme fonksiyonu
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({message: '', type: null}), 3000); // 3 saniye sonra kaybolacak
  };

  // Kategorileri getir
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          
          // Veri API'dan geliyor, "all" kategorisini ekle ve set et
          const categoriesWithAll = [
            { id: 'all', name: 'Tüm Kitaplar' },
            ...data.map((cat: any) => ({
              id: cat.id,
              name: cat.name
            }))
          ];
          
          setCategories(categoriesWithAll);
        }
      } catch (err) {
        console.error('Kategori getirme hatası:', err);
        // Hata durumunda default kategorileri kullan
      }
    };
    
    fetchCategories();
  }, []);

  // Kullanıcının token'ını localStorage'dan al
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setUserToken(token);
    
    // Sayfa yüklendiğinde localStorage'dan geçici favorileri yükle
    try {
      const storedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      if (Array.isArray(storedFavorites) && storedFavorites.length > 0) {
        console.log("LocalStorage'dan favoriler yükleniyor:", storedFavorites);
        setFavorites(storedFavorites);
      }
    } catch (err) {
      console.error("LocalStorage'dan favorileri yükleme hatası:", err);
    }
  }, []);

  useEffect(() => {
    // URL'den arama parametresi değiştiğinde searchTerm'i güncelle
    setSearchTerm(urlSearchTerm);
    // URL'den kategori parametresi değiştiğinde selectedCategory'i güncelle
    setSelectedCategory(urlCategory);
  }, [urlSearchTerm, urlCategory]);

  // Token yenileme fonksiyonu
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
        setUserToken(data.accessToken);
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
    let token = userToken;
    
    // İlk deneme
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });

    // 401 hatası alırsak (token geçersiz), token'ı yenile ve tekrar dene
    if (response.status === 401 && token) {
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

  // Favori kitapları getir
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userToken) {
        console.log("Favori getirme: Token yok, favoriler yüklenemiyor");
        return;
      }
      
      console.log("Favori kitapları getirme işlemi başlatılıyor");
      
      try {
        const response = await fetchWithTokenRefresh('/api/favorites');
        
        if (!response) {
          fetchBooks([]); // Token yenileme başarısız, kitapları favorsiz yükle
          return;
        }
        
        console.log("Favori getirme yanıtı:", response.status);
        
        if (response.ok) {
          const favoriteBooks = await response.json();
          console.log("Favori kitaplar (API yanıtı):", favoriteBooks);
          
          if (!Array.isArray(favoriteBooks)) {
            console.error("Favori kitaplar array değil:", favoriteBooks);
            fetchBooks([]);
            return;
          }
          
          // Kitapları API'den çekerken kullanabileceğimiz favori IDs'lerini saklayalım
          // Bu favorileBooks fav.id değeri, silme işlemi için kullanılacak
          const bookIdsInFavorites = favoriteBooks.map(fav => fav.bookId);
          console.log("Favori kitap ID'leri:", bookIdsInFavorites);
          setFavorites(bookIdsInFavorites);
          
          // Kitapları yükle
          fetchBooks(favoriteBooks);
        } else {
          console.error("Favori getirme hatası:", await response.text());
          // Hata durumunda da kitapları yükle
          fetchBooks([]);
        }
      } catch (err) {
        console.error('Favori kitapları getirme hatası:', err);
        // Hata durumunda da kitapları yükle
        fetchBooks([]);
      }
    };

    if (userToken) {
      fetchFavorites();
    } else {
      // Token yoksa favorisiz kitapları yükle
      console.log("Token olmadığı için favorisiz kitaplar yükleniyor");
      fetchBooks([]);
    }
  }, [userToken]);

  // Kategori değiştirme işlemi
  const handleCategoryChange = (categoryId: string) => {
    // URL parametrelerini güncelle (kategori ve arama)
    const params = new URLSearchParams(searchParams.toString());
    
    if (categoryId === 'all') {
      params.delete('category');
    } else {
      params.set('category', categoryId);
    }
    
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    
    const newUrl = `${pathname}?${params.toString()}`;
    router.push(newUrl);
    
    setSelectedCategory(categoryId);
  };

  // Kitapları getir
  const fetchBooks = async (favoriteBooks: any[]) => {
    try {
      setLoading(true);
      // API'ye bağlanmayı dene
      const response = await fetch('/api/books').catch(() => null);
      
      if (response && response.ok) {
        const data = await response.json();
        
        // Favori durumunu ekle
        const bookIdsInFavorites = favoriteBooks.map((fav: any) => fav.bookId);
        const booksWithFavorites = data.map((book: Book) => {
          // Kitabın favorilerde olup olmadığını kontrol et
          const isFavorite = bookIdsInFavorites.includes(book.id);
          // Eğer favorideyse, favoriteId'yi (silme için gereken ID) bul
          const favoriteId = isFavorite ? 
            favoriteBooks.find((fav: any) => fav.bookId === book.id)?.id : 
            undefined;
          
          // Kitaplara rastgele kategoriler atayalım
          // Gerçek bir uygulamada bu API'den gelir
          const bookCategories = getRandomCategories();
          
          return {
          ...book,
            isFavorite,
            favoriteId,
            categories: bookCategories
          };
        });
        
        console.log("Favori durumları eklenmiş kitaplar:", booksWithFavorites);
        setBooks(booksWithFavorites);
        setError(null);
      } else {
        // API çalışmıyorsa hata mesajı göster
        console.log('API yanıt vermedi veya hata oluştu');
        setBooks([]);
        setError('Kitap verileri şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin.');
      }
    } catch (err) {
      console.error('Kitap çekme hatası:', err);
      setError('Kitaplar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Rastgele kategoriler atar (gerçek uygulamada API'den gelecektir)
  const getRandomCategories = () => {
    const categoryIds = categories.slice(1).map(cat => cat.id); // 'all' hariç
    const numCategories = Math.floor(Math.random() * 3) + 1; // 1-3 arası kategori
    const shuffled = [...categoryIds].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numCategories);
  };

  // Kitapları filtrele
  const filteredBooks = books.filter(book => {
    // Arama filtresi
    const matchesSearch = searchTerm ? 
      (book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
       book.author.toLowerCase().includes(searchTerm.toLowerCase())) : 
      true;
    
    // Kategori filtresi
    const matchesCategory = selectedCategory === 'all' ? 
      true : 
      book.categories.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  // Favori ekle/kaldır
  const handleToggleFavorite = async (event: React.MouseEvent, bookId: string) => {
    event.stopPropagation(); // Kitap kartına tıklamayı engelle
    event.preventDefault(); // Sayfa yönlendirmesini engelle
    
    console.log("Favori işlemi başlatılıyor, bookId:", bookId);
    
    if (!userToken) {
      // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
      console.log("Kullanıcı giriş yapmamış, login sayfasına yönlendiriliyor");
      router.push('/login');
      return;
    }
    
    // Token kontrol
    console.log("Token durumu:", userToken ? "Var" : "Yok");
    
    try {
      const book = books.find(b => b.id === bookId);
      if (!book) {
        console.error("Kitap bulunamadı!");
        return;
      }
      
      console.log("İşlem yapılacak kitap:", book);
      
      if (book.isFavorite) {
        // Favorilerinizden kaldırma işlemi
        const favoriteId = book.favoriteId;
        console.log("Kaldırılacak favori ID:", favoriteId);
        
        if (!favoriteId) {
          console.error("Favori ID bulunamadı!");
          return;
        }
        
        console.log(`DELETE isteği gönderiliyor: /api/favorites/${favoriteId}`);
        const response = await fetch(`/api/favorites/${favoriteId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
        
        console.log("Favori kaldırma yanıtı:", response.status);
        const responseText = await response.text();
        console.log("Yanıt içeriği:", responseText);
        
        let responseData;
        try {
          if (responseText) {
            responseData = JSON.parse(responseText);
          }
        } catch (e) {
          console.error("JSON parse hatası:", e);
        }
        
        if (response.ok) {
          // Favorilerden kaldırıldı, state'i güncelle
          setFavorites(prevFavorites => prevFavorites.filter(id => id !== bookId));
          setBooks(prevBooks => prevBooks.map(b => 
            b.id === bookId ? { ...b, isFavorite: false, favoriteId: undefined } : b
          ));
          
          // Başarı bildirimi göster
          showNotification(`Kitap favorilerden kaldırıldı`, 'success');
          
          // localStorage'a favori durumunu kaydet
          try {
            const storedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            const updatedFavorites = storedFavorites.filter((id: string) => id !== bookId);
            localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
          } catch (err) {
            console.error("Favorileri localStorage'a kaydetme hatası:", err);
          }
        } else {
          console.error("Favori kaldırma hatası:", responseData?.error || responseText);
        }
      } else {
        // Favorilere ekle
        console.log("POST isteği gönderiliyor: /api/favorites");
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ bookId })
        });
        
        console.log("Favori ekleme yanıtı:", response.status);
        const responseText = await response.text();
        console.log("Yanıt içeriği:", responseText);
        
        let responseData;
        try {
          if (responseText) {
            responseData = JSON.parse(responseText);
          }
        } catch (e) {
          console.error("JSON parse hatası:", e);
        }
        
        // Başarı veya zaten favorilerde durumu
        if (response.ok || response.status === 409) {
          // API'den gelen ID'yi alıyoruz (ya yeni oluşturulmuş ID ya da zaten varsa olan ID)
          let favoriteId = undefined;
          
          if (responseData) {
            favoriteId = responseData.id;
          }
          
          console.log("Favori ID:", favoriteId);
          
          // Favorilere eklendi, state'i güncelle
          setFavorites(prevFavorites => [...prevFavorites, bookId]);
          setBooks(prevBooks => prevBooks.map(b => 
            b.id === bookId ? { ...b, isFavorite: true, favoriteId } : b
          ));
          
          // Başarı bildirimi göster
          showNotification(`Kitap favorilere eklendi`, 'success');
          
          // localStorage'a favori durumunu kaydet
          try {
            const storedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            if (!storedFavorites.includes(bookId)) {
              storedFavorites.push(bookId);
              localStorage.setItem('favorites', JSON.stringify(storedFavorites));
            }
          } catch (err) {
            console.error("Favorileri localStorage'a kaydetme hatası:", err);
          }
        } else {
          console.error("Favori ekleme hatası:", responseData?.error || responseText);
        }
      }
    } catch (err) {
      console.error('Favori işlemi hatası:', err);
    }
  };

  // Yerel aramayı yönet
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // URL'yi güncelle ama sadece searchTerm değeri varsa
    if (value.trim()) {
      // URL'yi güncelle ama sayfayı yeniden yükleme
      router.replace(`${pathname}?search=${encodeURIComponent(value)}`, { scroll: false });
    } else {
      // Arama terimi boşsa URL'den parametre kaldır
      router.replace(pathname, { scroll: false });
    }
  };

  // İade veya ödünç alma işlemi
  const handleReturnBook = async (event: React.MouseEvent, bookId: string) => {
    event.stopPropagation(); // Kitap kartına tıklamayı engelle
    event.preventDefault(); // Sayfa yönlendirmesini engelle
    
    if (!userToken) {
      // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
      router.push('/login');
      return;
    }
    
    try {
      // Kullanıcı bilgilerini localStorage'dan al
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }
      
      const user = JSON.parse(userStr);
      const userId = user.id;
      
      if (!userId) {
        router.push('/login');
        return;
      }
      
      // Kitabı bul
      const book = books.find(b => b.id === bookId);
      if (!book) return; // Kitap bulunamadıysa işlem yapma
      
      const action = book.available ? 'borrow' : 'return';
      
      // İade veya ödünç alma işlemi için API çağrısı
      const response = await fetchWithTokenRefresh(`/api/books/${bookId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action: action,
          userId: userId  // Kullanıcı ID'sini gönder
        }),
      });
      
      if (!response) {
        showNotification('İşlem sırasında kimlik doğrulama hatası oluştu', 'error');
        return;
      }
      
      if (response.ok) {
        // Kitap durumunu güncelle
        const updatedBook = !book.available;
        setBooks(books.map(b => 
          b.id === bookId ? { ...b, available: !b.available } : b
        ));
        
        // Başarı bildirimi göster
        showNotification(
          updatedBook ? `Kitap başarıyla iade edildi` : `Kitap başarıyla ödünç alındı`, 
          'success'
        );
      } else {
        console.error('API yanıt hatası:', response.status);
        showNotification('İşlem sırasında bir hata oluştu', 'error');
      }
    } catch (error) {
      console.error('İşlem hatası:', error);
    }
  };

  return (
    <>
      {/* Bildirim bileşeni */}
      {notification.type && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            position: 'fixed',
            top: '2rem',
            right: '2rem',
            zIndex: 50,
            padding: '1rem 1.5rem',
            borderRadius: '0.5rem',
            backgroundColor: notification.type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 
                             notification.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                             'rgba(59, 130, 246, 0.9)',
            color: 'white',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transform: 'translateY(0)',
            opacity: 1,
            transition: 'all 0.3s ease',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          {notification.message}
        </div>
      )}

      <div className="about-container">
        {/* Arka Plan Görseli */}
        <div className="about-background">
          <Image
            src="/library1.jpg"
            alt="Kütüphane Görünümü"
            fill
            style={{ objectFit: 'cover', opacity: 0.15 }}
            priority
            quality={90}
          />
        </div>
        
        <div className="about-main">
          <Navbar />

          {/* Kategoriler bölümü */}
          <div style={{
            padding: '1rem',
            maxWidth: '1200px',
            margin: '0 auto',
            marginTop: '2rem'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: '2rem'
            }}>
              {categories.map(category => (
                <div
                  key={category.id}
                  className={`category-item ${selectedCategory === category.id ? 'category-item-active' : ''}`}
                  onClick={() => handleCategoryChange(category.id)}
                >
                  {category.name}
                </div>
              ))}
            </div>
          </div>
          
          {/* Arama ve Sayfa Başlığı */}
          <div 
            className="title-container" 
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '1rem',
              marginBottom: '2rem'
            }}
          >
            <h1 
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '2.5rem',
                fontWeight: '800',
                backgroundImage: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 2px 10px rgba(142, 197, 252, 0.3)',
                letterSpacing: '2px',
                animation: 'fadeIn 1.5s ease-in-out, glow 3s ease-in-out infinite',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}
            >
              {selectedCategory === 'all' ? 'Tüm Kitaplar' : 
              categories.find(c => c.id === selectedCategory)?.name || 'Kitaplar'}
            </h1>
            
            {/* Arama Kutusu */}
            <div style={{
              margin: '0 auto',
              maxWidth: '600px',
              position: 'relative'
            }}>
              <input
                type="text"
                placeholder="Kitap veya yazar ara..."
                value={searchTerm}
                onChange={handleSearch}
                aria-label="Kitap veya yazar arama"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 3rem',
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
          
          {/* Kitap Listesi */}
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '1rem'
          }}>
            {/* Yükleniyor, Hata veya Sonuç Gösterimi */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ 
                  display: 'inline-block',
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  borderTop: '2px solid #3b82f6',
                  borderRight: '2px solid transparent',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '1rem'
                }}></div>
                <p style={{ color: '#94a3b8', fontSize: '1.25rem' }}>Kitaplar yükleniyor...</p>
              </div>
            ) : error ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                color: '#ef4444',
                background: 'rgba(220, 38, 38, 0.1)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(220, 38, 38, 0.2)'
              }}>
                <p style={{ fontSize: '1.25rem' }}>{error}</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                color: '#94a3b8',
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '0.5rem',
                border: '1px solid rgb(74, 81, 91)',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                {searchTerm ? 'Aramanıza uygun kitap bulunamadı.' : 'Henüz kitap bulunmuyor.'}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1rem',
                margin: '2rem 0'
              }}>
                {filteredBooks.map(book => (
                  <div 
                    key={book.id}
                    className="shadow-md overflow-hidden border mb-4"
                    style={{
                      backgroundColor: 'rgba(17, 24, 39, 0.7)',
                      transition: 'all 0.5s ease',
                      borderRadius: '1rem',
                      border: '1px solid rgba(30, 41, 59, 0.6)',
                      height: 'auto',  // Esnek yükseklik için değiştirdik
                      minHeight: '380px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)';
                      e.currentTarget.style.borderRadius = '1.2rem';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                      e.currentTarget.style.borderRadius = '1rem';
                    }}
                  >
                    <div style={{ position: 'relative', padding: '1.5rem' }}>
                      <div style={{ 
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        zIndex: 10
                      }}>
                        <button
                          onClick={(e) => handleToggleFavorite(e, book.id)}
                          aria-label={book.isFavorite ? "Favorilerden kaldır" : "Favorilere ekle"}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            width: '1.75rem',
                            height: '1.75rem',
                            backgroundColor: book.isFavorite ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <svg 
                            width="16"
                            height="16"
                            fill={book.isFavorite ? '#ef4444' : 'none'}
                            stroke={book.isFavorite ? '#ef4444' : 'white'}
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="2"
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                            />
                          </svg>
                          <div 
                            className="favorite-tooltip"
                            style={{
                              position: 'absolute', 
                              bottom: 'calc(100% + 5px)',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              color: 'white',
                              padding: '0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              whiteSpace: 'nowrap',
                              pointerEvents: 'none',
                              opacity: 0,
                              transition: 'opacity 0.2s ease'
                            }}
                          >
                            {book.isFavorite ? 'Favorilerden Kaldır' : 'Favorilere Ekle'}
                          </div>
                        </button>
                      </div>
                      
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: 'white',
                        minHeight: '2.5rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {book.title}
                      </h3>
                      
                      <p style={{ 
                        color: '#94a3b8', 
                        marginBottom: '0.5rem' 
                      }}>
                        {book.author}
                      </p>
                      
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#64748b',
                        marginBottom: '1rem'
                      }}>
                        Yayın: {book.published}
                      </p>

                      {/* Kategori etiketleri */}
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '0.5rem',
                        marginBottom: '1rem' 
                      }}>
                        {book.categories.map(categoryId => {
                          const category = categories.find(c => c.id === categoryId);
                          if (!category) return null;
                          
                          return (
                            <span 
                              key={categoryId}
                              style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                color: '#93c5fd',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryChange(categoryId);
                              }}
                            >
                              {category.name}
                            </span>
                          );
                        })}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          height: '0.5rem',
                          width: '0.5rem',
                          borderRadius: '50%',
                          backgroundColor: book.available ? '#10b981' : '#ef4444',
                          marginRight: '0.5rem'
                        }}></div>
                        <p style={{
                          fontSize: '0.875rem',
                          color: book.available ? '#a7f3d0' : '#fca5a5'
                        }}>
                          {book.available ? 'Müsait' : 'Ödünç Alındı'}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ 
                      marginTop: 'auto',
                      padding: '1rem 1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <Link 
                        href={`/books/${book.id}`} 
                        aria-label={`${book.title} kitabının detaylarını görüntüle`}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          color: '#93c5fd',
                          borderRadius: '0.5rem',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          transition: 'all 0.5s ease',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.4)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.borderRadius = '0.7rem';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.borderRadius = '0.5rem';
                        }}>
                        Detaylar
                      </Link>
                      
                      {userToken && book.available && (
                        <button
                          onClick={(e) => handleReturnBook(e, book.id)}
                          aria-label={`${book.title} kitabını ödünç al`}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            color: '#6ee7b7',
                            borderRadius: '0.5rem',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            transition: 'all 0.5s ease',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.4)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.borderRadius = '0.7rem';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.borderRadius = '0.5rem';
                          }}
                        >
                          Ödünç Al
                        </button>
                      )}
                      
                      {userToken && !book.available && (
                        <button
                          onClick={(e) => handleReturnBook(e, book.id)}
                          aria-label={`${book.title} kitabını iade et`}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            color: '#fca5a5',
                            borderRadius: '0.5rem',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            transition: 'all 0.5s ease',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.4)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.borderRadius = '0.7rem';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.borderRadius = '0.5rem';
                          }}
                        >
                          İade Et
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Kitaplar Sayfası
 * Tüm kitapları listeler ve kitap detaylarına bağlantı sağlar
 */
export default function BooksPage() {
  return (
    <Suspense fallback={
      <div className="about-container">
        {/* Arka Plan Görseli */}
        <div className="about-background">
          <Image
            src="/library1.jpg"
            alt="Kütüphane Görünümü"
            fill
            style={{ objectFit: 'cover', opacity: 0.15 }}
            priority
            quality={90}
          />
        </div>
        
        <div className="about-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <GlobalStyles />
          <div style={{ textAlign: 'center', padding: '2rem', position: 'relative', zIndex: 1 }}>
            <div style={{ 
              display: 'inline-block',
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              borderTop: '3px solid rgb(55, 60, 69)',
              borderRight: '3px solid transparent',
              animation: 'spin 1s linear infinite',
              marginBottom: '1rem'
            }}></div>
            <p style={{ color: '#94a3b8', fontSize: '1.5rem' }}>Yükleniyor...</p>
          </div>
        </div>
      </div>
    }>
      <BooksContent />
    </Suspense>
  );
}