'use client';

<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import React, { useState, useEffect, Suspense, useCallback } from 'react';
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Image from 'next/image';
<<<<<<< HEAD
import { FaSearch, FaHeart, FaRegHeart } from 'react-icons/fa';
=======
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782

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

<<<<<<< HEAD
// Kategorileri tanımla
=======
interface Category {
  id: string;
  name: string;
}

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info' | null;
}

// Kategorileri tanımla - Bu artık veritabanından gelecek
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
const defaultCategories = [
  { id: 'all', name: 'Tüm Kitaplar' },
  { id: 'fiction', name: 'Kurgu' },
  { id: 'nonfiction', name: 'Bilim ve Eğitim' },
  { id: 'classics', name: 'Klasikler' },
  { id: 'mystery', name: 'Polisiye' },
  { id: 'biography', name: 'Biyografi' },
  { id: 'history', name: 'Tarih' }
];

// Global stillerimizi tanımlayalım
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

export default function BooksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSearchTerm = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'all';

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
<<<<<<< HEAD
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([urlCategory]);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [categories, setCategories] = useState([...defaultCategories]);

  // Kullanıcı token'ını al
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setUserToken(token);
  }, []);

  // Kategorileri getir
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
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
      }
    };
    
    fetchCategories();
  }, []);

  // Kitapları getir
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        // Sadece veritabanındaki kitapları getir
        const response = await fetch('/api/books');
        if (!response.ok) {
          throw new Error('Kitaplar yüklenirken bir hata oluştu');
        }
        const data = await response.json();
        setBooks(data);
      } catch (err: any) {
        console.error('Kitap yükleme hatası:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
=======
  const [searchTerm, setSearchTerm] = useState<string>(urlSearchTerm);
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [bookFavorites, setBookFavorites] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notification, setNotification] = useState<Notification>({ message: '', type: null });
  const router = useRouter();
  const pathname = usePathname();

  // Bildirim gösterme fonksiyonu
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: null }), 3000); // 3 saniye sonra kaybolacak
  };

  // Kitapları getirme fonksiyonu
  const fetchBooks = useCallback(async (selectedCategory?: string) => {
    setLoading(true);
    console.log("Kitaplar getiriliyor...");
    
    try {
      const endpoint = selectedCategory && selectedCategory !== "all" 
        ? `/api/books?category=${selectedCategory}` 
        : '/api/books';
      
      console.log(`API isteği: ${endpoint}`);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Kitapları getirme hatası: ${response.status} - ${errorText}`);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log(`${data.length} kitap alındı`);
      
      // Kullanıcı giriş yapmışsa, favori durumunu kontrol et
      if (userToken) {
        console.log("Kullanıcı giriş yapmış, favoriler kontrol ediliyor");
        const favResponse = await fetch('/api/favorites', {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
        
        if (favResponse.ok) {
          const favorites = await favResponse.json();
          console.log(`${favorites.length} favori alındı`);
          
          // Favori kitap ID'lerini al
          const favoriteBookIds = favorites.map((fav: any) => fav.bookId);
          
          // bookFavorites state'ini güncelle
          setBookFavorites(favoriteBookIds);
          
          // Kitapların favori durumunu güncelle
          const updatedBooks = data.map((book: Book) => {
            const favorite = favorites.find((f: any) => f.bookId === book.id);
            return {
              ...book,
              isFavorite: !!favorite,
              favoriteId: favorite?.id
            };
          });
          
          setBooks(updatedBooks);
        } else {
          console.error("Favorileri getirme hatası");
          setBooks(data);
        }
      } else {
        console.log("Kullanıcı giriş yapmamış, normal kitap listesi gösteriliyor");
        setBooks(data);
      }
    } catch (error) {
      console.error("Kitapları getirme hatası:", error);
    } finally {
      setLoading(false);
    }
  }, [userToken]);
  
  // Kategorileri getirme fonksiyonu
  const fetchCategories = useCallback(async () => {
    console.log("Kategoriler getiriliyor...");
    
    try {
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Kategorileri getirme hatası: ${response.status} - ${errorText}`);
        return;
      }
      
      const data = await response.json();
      console.log(`${data.length} kategori alındı`);
      
      // "Tümü" kategorisini ekle
      setCategories([{ id: 'all', name: 'Tümü' }, ...data]);
    } catch (error) {
      console.error("Kategorileri getirme hatası:", error);
    }
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
  }, []);
  
  // Kullanıcı token'ını al
  useEffect(() => {
    console.log("Token kontrol ediliyor...");
    
    const checkToken = () => {
      const token = localStorage.getItem('token');
      console.log("localStorage token durumu:", token ? "Var" : "Yok");
      setUserToken(token);
    };
    
    checkToken();
    
    // Token değişikliklerini dinle
    window.addEventListener('storage', checkToken);
    
    return () => {
      window.removeEventListener('storage', checkToken);
    };
  }, []);
  
  // Kitapları ve kategorileri ilk yüklemede getir
  useEffect(() => {
    console.log("Kitap ve kategori getirme useEffect çalışıyor");
    
    fetchCategories();
    fetchBooks();
    
    // Kullanıcı token'ı değiştiğinde kitapları tekrar getir
  }, [userToken, fetchBooks, fetchCategories]);

<<<<<<< HEAD
  // Favori durumunu kontrol et
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userToken) return;

      try {
        const response = await fetch('/api/favorites', {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });

        if (!response.ok) return;

        const favorites = await response.json();
        setBooks(prevBooks => prevBooks.map(book => {
          const favorite = favorites.find((f: any) => f.bookId === book.id);
          return {
            ...book,
            isFavorite: !!favorite,
            favoriteId: favorite?.id
          };
        }));
      } catch (err) {
        console.error('Favoriler yüklenirken hata:', err);
      }
    };

    fetchFavorites();
  }, [userToken]);

  // Kategori değiştirme
=======
  useEffect(() => {
    // URL'den arama parametresi değiştiğinde searchTerm'i güncelle
    setSearchTerm(urlSearchTerm);
    // URL'den kategori parametresi değiştiğinde selectedCategory'i güncelle
    setSelectedCategory(urlCategory);
  }, [urlSearchTerm, urlCategory]);

  // Kategori değiştirme işlemi
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
  const handleCategoryChange = (categoryId: string) => {
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
    setSelectedCategories([categoryId]);
  };

<<<<<<< HEAD
  // Arama işlemi
=======
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
      book.categories && book.categories.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  // Favoriye ekleme fonksiyonu
  const addToFavorites = async (bookId: string) => {
    if (!userToken) {
      showNotification('Favori eklemek için giriş yapmalısınız', 'error');
      return;
    }

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({ bookId })
      });

      if (response.ok) {
        const newFavorite = await response.json();
        showNotification('Kitap favorilere eklendi', 'success');
        
        // Kitabın favori durumunu güncelle
        setBooks(prevBooks => 
          prevBooks.map(book => 
            book.id === bookId 
              ? { ...book, isFavorite: true, favoriteId: newFavorite.id } 
              : book
          )
        );
        
        // BookFavorites state'ini güncelle
        setBookFavorites(prev => [...prev, bookId]);
      } else {
        const error = await response.json();
        showNotification(error.message || 'Kitap favorilere eklenemedi', 'error');
      }
    } catch (error) {
      console.error('Favoriye ekleme hatası:', error);
      showNotification('Bir hata oluştu, lütfen tekrar deneyin', 'error');
    }
  };

  // Favoriden çıkarma fonksiyonu
  const removeFromFavorites = async (bookId: string, favoriteId?: string) => {
    if (!userToken) {
      showNotification('Bu işlem için giriş yapmalısınız', 'error');
      return;
    }

    try {
      // FavoriteId biliniyorsa doğrudan o ID ile silme işlemi yap
      // Bilinmiyorsa, kitap ID'si ile endpoint oluştur
      const endpoint = favoriteId 
        ? `/api/favorites/${favoriteId}` 
        : `/api/favorites/book/${bookId}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      if (response.ok) {
        showNotification('Kitap favorilerden çıkarıldı', 'success');
        
        // Kitabın favori durumunu güncelle
        setBooks(prevBooks => 
          prevBooks.map(book => 
            book.id === bookId 
              ? { ...book, isFavorite: false, favoriteId: undefined } 
              : book
          )
        );
        
        // BookFavorites state'ini güncelle
        setBookFavorites(prev => prev.filter(id => id !== bookId));
      } else {
        const error = await response.json();
        showNotification(error.message || 'Kitap favorilerden çıkarılamadı', 'error');
      }
    } catch (error) {
      console.error('Favoriden çıkarma hatası:', error);
      showNotification('Bir hata oluştu, lütfen tekrar deneyin', 'error');
    }
  };

  // Yerel aramayı yönet
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    
    if (selectedCategories.length > 0) {
      params.set('category', selectedCategories[0]);
    }
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Favori ekle/kaldır
  const handleToggleFavorite = async (event: React.MouseEvent, bookId: string) => {
    event.stopPropagation();
    
    // Token'ı doğrudan localStorage'dan al
    const token = localStorage.getItem('accessToken');
    if (!token) {
      // Giriş modalını aç
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('openLoginModal'));
      }
      return;
    }

    const book = books.find(b => b.id === bookId);
    if (!book) return;

    try {
      if (book.isFavorite && book.favoriteId) {
        const response = await fetch(`/api/favorites/${book.favoriteId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setBooks(books.map(b => 
            b.id === bookId ? { ...b, isFavorite: false, favoriteId: undefined } : b
          ));
        }
      } else {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ bookId })
        });

        if (response.ok) {
          const data = await response.json();
          setBooks(books.map(b => 
            b.id === bookId ? { ...b, isFavorite: true, favoriteId: data.id } : b
          ));
        }
      }
    } catch (error) {
      console.error("Favori işlemi hatası:", error);
    }
  };

  // Kitabı ödünç al/iade et
  const handleBorrowBook = async (event: React.MouseEvent, bookId: string) => {
    event.stopPropagation();
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('openLoginModal'));
      }
      return;
    }

    const userId = getUserIdFromToken(token);
    const book = books.find(b => b.id === bookId);
    if (!book || !userId) return;

    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: book.available ? 'borrow' : 'return',
          userId
        })
      });

      if (response.ok) {
        setBooks(books.map(b => 
          b.id === bookId ? { ...b, available: !b.available } : b
        ));
      }
    } catch (error) {
      console.error('Kitap işlemi hatası:', error);
    }
  };

  // Filtrelenmiş kitaplar
  const filteredBooks = books.filter(book => {
    const matchesSearch = !searchTerm || 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 'Tüm Kitaplar' seçiliyse veya hiç kategori seçili değilse, kategoriye bakma
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes('all') ||
      book.categories.some(category => selectedCategories.includes(category));
    
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <GlobalStyles />
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
              flexDirection: 'row',
              justifyContent: 'center',
              marginBottom: '2rem',
              backgroundColor: 'rgba(17, 24, 39, 0.6)',
              borderRadius: '0.75rem',
              padding: '0.75rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                justifyContent: 'center'
              }}>
                {categories.map(category => (
                  <div
                    key={category.id}
                    className={`category-item ${selectedCategories.includes(category.id) ? 'category-item-active' : ''}`}
                    onClick={() => handleCategoryChange(category.id)}
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                  >
                    {category.name}
                  </div>
                ))}
              </div>
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
              {selectedCategories.length === 0 ? 'Tüm Kitaplar' : 
               categories.find(c => c.id === selectedCategories[0])?.name || 'Kitaplar'}
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
                      height: 'auto',
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
                        zIndex: 20
                      }}>
                        {/* Favoriler Butonu */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (book.isFavorite) {
                              removeFromFavorites(book.id, book.favoriteId);
                            } else {
                              addToFavorites(book.id);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            borderRadius: '9999px',
                            color: book.isFavorite ? '#ef4444' : '#94a3b8',
                            transition: 'all 0.2s',
                            background: 'rgba(17, 24, 39, 0.7)'
                          }}
                          onMouseOver={(e) => {
                            if (!book.isFavorite) {
                              e.currentTarget.style.color = '#ef4444';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!book.isFavorite) {
                              e.currentTarget.style.color = '#94a3b8';
                            }
                          }}
                          aria-label={book.isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
                        >
                          {book.isFavorite ? <AiFillHeart size={24} /> : <AiOutlineHeart size={24} />}
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
                        {book.categories && book.categories.map(categoryId => {
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
                      
                      {/* Durum etiketi */}
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
                        }}
                      >
                        Detaylar
                      </Link>
                      
                      <button
                        onClick={(e) => handleBorrowBook(e, book.id)}
                        aria-label={book.available ? `${book.title} kitabını ödünç al` : `${book.title} kitabını iade et`}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: book.available ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: book.available ? '#6ee7b7' : '#fca5a5',
                          borderRadius: '0.5rem',
                          textDecoration: 'none',
                          fontSize: '0.875rem',
                          transition: 'all 0.5s ease',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = book.available ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.borderRadius = '0.7rem';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = book.available ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.borderRadius = '0.5rem';
                        }}
                      >
                        {book.available ? 'Ödünç Al' : 'İade Et'}
                      </button>
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