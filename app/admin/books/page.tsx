'use client';

import React, { useState, useEffect, CSSProperties, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

/**
 * Kitap Yönetimi Sayfası
 * Admin paneli içinde kitap ekleme, listeleme, düzenleme ve silme işlemlerini yapar
 */
export default function AdminBooksPage() {
  const router = useRouter();

  // Kitap verileri için state'ler
  const [books, setBooks] = useState<any[]>([]);
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [published, setPublished] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<any | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Yükleme ve hata durumları için state'ler
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Kitapları API'den getir
  useEffect(() => {
    fetchBooks();
  }, []);

  // Kategorileri API'den getir
  useEffect(() => {
    fetchCategories();
  }, []);

  // Kategorileri getiren fonksiyon
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error('Kategoriler getirilirken bir hata oluştu');
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Kategori getirme hatası:', err);
      // Hata durumunda işlem yapma
    } finally {
      setLoadingCategories(false);
    }
  };

  // Kitapları getiren asenkron fonksiyon
  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/books');
      
      if (!response.ok) {
        throw new Error('Kitaplar getirilirken bir hata oluştu');
      }
      
      const data = await response.json();
      
      // Kitapları kategorileriyle birlikte getir
      const booksWithCategoriesPromises = data.map(async (book: any) => {
        try {
          const catResponse = await fetch(`/api/books/${book.id}/categories`);
          if (catResponse.ok) {
            const categories = await catResponse.json();
            return { ...book, categories };
          }
        } catch (err) {
          console.error(`${book.id} ID'li kitabın kategorileri getirilemedi:`, err);
        }
        return book;
      });
      
      const booksWithCategories = await Promise.all(booksWithCategoriesPromises);
      setBooks(booksWithCategories);
    } catch (err) {
      console.error('Kitap getirme hatası:', err);
      setError('Kitaplar yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  // Kitap ekleme/güncelleme formu gönderme işlemi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // Yılı sayıya çevir
      const publishedYear = parseInt(published);
      if (isNaN(publishedYear)) {
        throw new Error('Geçerli bir yayın yılı giriniz');
      }
      
      // Kitap verilerini hazırla
      const bookData = {
        title,
        author,
        published: publishedYear,
        imageUrl,
        categories: selectedCategories.map(id => ({ categoryId: id })),
      };
      
      let response;
      
      try {
        if (editingBook) {
          // Kitap güncelleme
          response = await fetch(`/api/books/${editingBook.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookData),
          });
        } else {
          // Yeni kitap ekleme
          response = await fetch('/api/books', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookData),
          });
        }
        
        // Yanıtı alın (JSON olmasa bile)
        let responseText = '';
        let errorData = null;
        
        try {
          responseText = await response.text();
          
          try {
            errorData = JSON.parse(responseText);
          } catch (parseError) {
            console.error('Yanıt JSON olarak ayrıştırılamadı:', parseError);
          }
        } catch (textError) {
          console.error('Yanıt metni alınamadı:', textError);
        }
        
        if (!response.ok) {
          throw new Error(
            errorData?.error || 
            `Kitap kaydedilirken bir hata oluştu (Status: ${response.status}): ${responseText}`
          );
        }
        
        // Başarılı işlem sonrası state'leri güncelle
        const responseData = errorData || {};
        
        if (editingBook) {
          setSuccessMessage(`"${title}" başlıklı kitap başarıyla güncellendi`);
          setBooks(books.map(book => book.id === editingBook.id ? responseData : book));
        } else {
          setSuccessMessage(`"${title}" başlıklı kitap başarıyla eklendi`);
          setBooks([...books, responseData]);
        }
        
        // Formu temizle
        resetForm();
      } catch (fetchErr) {
        throw fetchErr;
      }
      
    } catch (err) {
      console.error('Kitap kaydetme hatası:', err);
      setError((err as Error).message || 'Kitap kaydedilirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  // Kitap silme işlemi
  const handleDelete = async (id: string, index: number) => {
    if (!confirm('Bu kitabı silmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      setIsDeleting(index);
      setError(null);
      setSuccessMessage(null);
      
      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kitap silinirken bir hata oluştu');
      }
      
      // Kitap listesini güncelle
      setBooks(books.filter(book => book.id !== id));
      setSuccessMessage('Kitap başarıyla silindi');
      
    } catch (err) {
      console.error('Kitap silme hatası:', err);
      setError((err as Error).message || 'Kitap silinirken bir hata oluştu');
    } finally {
      setIsDeleting(null);
    }
  };

  // Kitap düzenleme işlemi
  const handleEdit = (book: any) => {
    setEditingBook(book);
    setTitle(book.title);
    setAuthor(book.author);
    setPublished(book.published.toString());
    setImageUrl(book.imageUrl || '');
    
    // Kitabın kategorilerini ayarla (varsa)
    if (book.categories && Array.isArray(book.categories)) {
      const categoryIds = book.categories.map((cat: any) => cat.categoryId);
      setSelectedCategories(categoryIds);
    } else {
      setSelectedCategories([]);
    }
    
    // Form alanına scroll
    document.getElementById('bookForm')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Form alanlarını temizle ve düzenleme modundan çık
  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setPublished('');
    setImageUrl('');
    setEditingBook(null);
    setSelectedCategories([]);
  };

  // Resmi kaldır
  const handleRemoveImage = () => {
    setImageUrl('');
  };

  // Geri dön butonu için handler
  const handleGoBack = () => {
    router.push('/admin');
  };

  // Resim yükleme işlemi
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya boyutunu kontrol et (10MB limite)
    if (file.size > 10 * 1024 * 1024) {
      setError('Resim boyutu 10MB\'dan küçük olmalıdır!');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Resmi canvas kullanarak sıkıştır
      const compressedImage = await compressImage(file, 800); // 800px maksimum genişlik/yükseklik
      
      // Base64 formatını kontrol et
      const validatedImage = validateAndFixBase64(compressedImage);
      
      setImageUrl(validatedImage);
      setIsUploading(false);
    } catch (err) {
      console.error('Resim yükleme hatası:', err);
      setError('Resim yüklenirken bir hata oluştu');
      setIsUploading(false);
    }
  };

  // Base64 formatını doğrula ve düzelt
  const validateAndFixBase64 = (base64String: string): string => {
    // Base64 formatını kontrol et
    if (!base64String) return '';
    
    // Sadece veri kısmını al (data:image/jpeg;base64, kısmını temizle)
    let cleanBase64 = base64String;
    if (base64String.includes(';base64,')) {
      // Prefix'i koru, sadece kontrol et
      console.log('Base64 prefix mevcut:', base64String.split(';base64,')[0]);
    } else {
      console.log('Base64 prefix mevcut değil, ekleniyor...');
      // Prefix eklenmemiş, jpeg formatında prefix ekle
      cleanBase64 = 'data:image/jpeg;base64,' + base64String;
    }
    
    return cleanBase64;
  };

  // Resim sıkıştırma fonksiyonu
  const compressImage = (file: File, maxSize: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            
            // Aşırı sıkıştırma - Resim boyutunu çok küçük tut (200px max)
            const maxImageSize = 200;
            let width = img.width;
            let height = img.height;
            
            if (width > height && width > maxImageSize) {
              height = Math.round(height * maxImageSize / width);
              width = maxImageSize;
            } else if (height > maxImageSize) {
              width = Math.round(width * maxImageSize / height);
              height = maxImageSize;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Canvas context oluşturulamadı'));
              return;
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Çok düşük kalite (0.2) ile JPEG formatına dönüştür
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.2);
            console.log('Sıkıştırılmış resim boyutu:', Math.round(compressedDataUrl.length / 1024), 'KB');
            
            // Hala büyükse, tekrar sıkıştır
            if (compressedDataUrl.length > 200 * 1024) { // 200KB'dan büyükse
              // Boyutu daha da küçült (100px)
              const tinyCanvas = document.createElement('canvas');
              const tinySize = 100;
              let tinyWidth = width;
              let tinyHeight = height;
              
              if (tinyWidth > tinyHeight && tinyWidth > tinySize) {
                tinyHeight = Math.round(tinyHeight * tinySize / tinyWidth);
                tinyWidth = tinySize;
              } else if (tinyHeight > tinySize) {
                tinyWidth = Math.round(tinyWidth * tinySize / tinyHeight);
                tinyHeight = tinySize;
              }
              
              tinyCanvas.width = tinyWidth;
              tinyCanvas.height = tinyHeight;
              
              const tinyCtx = tinyCanvas.getContext('2d');
              if (!tinyCtx) {
                reject(new Error('Canvas context oluşturulamadı'));
                return;
              }
              
              tinyCtx.drawImage(img, 0, 0, tinyWidth, tinyHeight);
              
              // Daha da düşük kalite (0.1)
              const tinyDataUrl = tinyCanvas.toDataURL('image/jpeg', 0.1);
              console.log('Aşırı sıkıştırılmış resim boyutu:', Math.round(tinyDataUrl.length / 1024), 'KB');
              
              resolve(tinyDataUrl);
            } else {
              resolve(compressedDataUrl);
            }
          } catch (error) {
            console.error('Resim sıkıştırma hatası:', error);
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Resim işlenirken hata oluştu'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Resim okunamadı'));
      };
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle category selection
  const toggleCategory = (category: any) => {
    setSelectedCategories(prev => {
      const isSelected = prev.some(cat => cat === category.id);
      if (isSelected) {
        return prev.filter(id => id !== category.id);
      } else {
        return [...prev, category.id];
      }
    });
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
    padding: '2rem 1rem',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  // Başlık stili
  const titleStyle: CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: 'white',
  };

  // Alt başlık stili
  const subtitleStyle: CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginTop: '2rem',
    marginBottom: '1rem',
    color: 'white',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: '0.5rem',
  };

  // Form container stili
  const formContainerStyle: CSSProperties = {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: '8px',
    padding: '2rem',
    backdropFilter: 'blur(8px)',
    marginBottom: '2rem',
  };

  // Form grid stili
  const formGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
  };

  // Form grubu stili
  const formGroupStyle: CSSProperties = {
    marginBottom: '1rem',
  };

  // Form etiketi stili
  const labelStyle: CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#d1d5db',
    fontSize: '0.875rem',
  };

  // Form input stili
  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    color: 'white',
    fontSize: '1rem',
  };

  // Buton container stili
  const buttonContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
  };

  // Ana buton stili
  const primaryButtonStyle: CSSProperties = {
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
    padding: '0.75rem 1.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '0.875rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  };

  // Tablo container stili
  const tableContainerStyle: CSSProperties = {
    overflowX: 'auto',
  };

  // Tablo stili
  const tableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 0.5rem',
    margin: '1rem 0',
  };

  // Tablo başlık stili
  const tableHeaderStyle: CSSProperties = {
    textAlign: 'left',
    color: '#d1d5db',
    fontSize: '0.875rem',
    fontWeight: 'normal',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  };

  // Tablo hücre stili
  const tableCellStyle: CSSProperties = {
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    color: 'white',
    fontSize: '0.875rem',
  };

  // İlk hücre stili (yuvarlatılmış köşeler)
  const firstCellStyle: CSSProperties = {
    ...tableCellStyle,
    borderTopLeftRadius: '6px',
    borderBottomLeftRadius: '6px',
  };

  // Son hücre stili (yuvarlatılmış köşeler)
  const lastCellStyle: CSSProperties = {
    ...tableCellStyle,
    borderTopRightRadius: '6px',
    borderBottomRightRadius: '6px',
  };

  // İşlem butonları konteyneri
  const actionButtonsStyle: CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
  };

  // Düzenleme butonu stili
  const editButtonStyle: CSSProperties = {
    padding: '0.5rem 0.75rem',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    color: '#60a5fa',
    borderRadius: '4px',
    fontSize: '0.75rem',
    border: 'none',
    cursor: 'pointer',
  };

  // Silme butonu stili
  const deleteButtonStyle: CSSProperties = {
    padding: '0.5rem 0.75rem',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    borderRadius: '4px',
    fontSize: '0.75rem',
    border: 'none',
    cursor: 'pointer',
  };

  // Mesaj kutusu stili
  const messageBoxStyle: CSSProperties = {
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  };

  // Yükleniyor mesajı stili
  const loadingMessageStyle: CSSProperties = {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.125rem',
    color: '#d1d5db',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      {/* Admin Menü Bar */}
      <div className="admin-menu-bar">
        <div className="admin-menu-bar-inner">
          <div className="admin-menu-flex">
            <h2 className="admin-menu-title">Admin Panel</h2>
            <div className="admin-menu-links">
              <Link href="/admin" className="admin-menu-link">Dashboard</Link>
              <Link href="/admin/books" className="admin-menu-link admin-menu-link-active">Kitaplar</Link>
              <Link href="/admin/users" className="admin-menu-link">Kullanıcılar</Link>
              <Link href="/admin/borrows" className="admin-menu-link">Ödünç Alma</Link>
              <Link href="/admin/reports" className="admin-menu-link">Raporlar</Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div style={containerStyle}>
          <div style={backgroundStyle} />
          
          <div style={contentStyle}>
            {/* Başlık ve geri butonu */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h1 style={titleStyle}>Kitap Yönetimi</h1>
              <button 
                style={secondaryButtonStyle}
                onClick={handleGoBack}
              >
                Admin Paneline Dön
              </button>
            </div>
            
            {/* Stats kartları */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card admin-stat-card-blue">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider font-medium">Toplam Kitaplar</p>
                    <h3 className="text-2xl font-semibold text-white mt-2">{books.length}</h3>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    📚
                  </div>
                </div>
                <div className="admin-stat-indicator admin-stat-indicator-blue"></div>
              </div>
              
              <div className="admin-stat-card admin-stat-card-purple">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider font-medium">Müsait Kitaplar</p>
                    <h3 className="text-2xl font-semibold text-white mt-2">{books.filter(book => book.available).length}</h3>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    🔖
                  </div>
                </div>
                <div className="admin-stat-indicator admin-stat-indicator-purple"></div>
              </div>
              
              <div className="admin-stat-card admin-stat-card-amber">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider font-medium">Ödünç Kitaplar</p>
                    <h3 className="text-2xl font-semibold text-white mt-2">{books.filter(book => !book.available).length}</h3>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl">
                    📖
                  </div>
                </div>
                <div className="admin-stat-indicator admin-stat-indicator-amber"></div>
              </div>
            </div>
            
            {/* Başarı mesajı */}
            {successMessage && (
              <div style={{
                ...messageBoxStyle,
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
              }}>
                {successMessage}
              </div>
            )}
            
            {/* Hata mesajı */}
            {error && (
              <div style={{
                ...messageBoxStyle,
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
              }}>
                {error}
              </div>
            )}
            
            {/* Kitap ekleme/düzenleme formu */}
            <div id="bookForm" style={formContainerStyle}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                {editingBook ? 'Kitap Düzenle' : 'Yeni Kitap Ekle'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div style={formGridStyle}>
                  <div style={formGroupStyle}>
                    <label htmlFor="title" style={labelStyle}>Kitap Başlığı</label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      style={inputStyle}
                      placeholder="Örn: Suç ve Ceza"
                      required
                    />
                  </div>
                  
                  <div style={formGroupStyle}>
                    <label htmlFor="author" style={labelStyle}>Yazar</label>
                    <input
                      type="text"
                      id="author"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      style={inputStyle}
                      placeholder="Örn: Fyodor Dostoyevski"
                      required
                    />
                  </div>
                  
                  <div style={formGroupStyle}>
                    <label htmlFor="published" style={labelStyle}>Yayın Yılı</label>
                    <input
                      type="number"
                      id="published"
                      value={published}
                      onChange={(e) => setPublished(e.target.value)}
                      style={inputStyle}
                      placeholder="Örn: 1866"
                      min="1"
                      max={new Date().getFullYear()}
                      required
                    />
                  </div>

                  <div style={formGroupStyle}>
                    <label htmlFor="categories" style={labelStyle}>Kategoriler</label>
                    <div className="relative w-full" ref={dropdownRef}>
                      {/* Dropdown toggle button */}
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full flex items-center justify-between text-left"
                        style={{
                          ...inputStyle,
                          cursor: 'pointer',
                          paddingRight: '0.75rem',
                        }}
                      >
                        <span className="truncate">
                          {selectedCategories.length > 0 && categories?.length > 0
                            ? selectedCategories.map(id => {
                                const category = categories.find(c => c.id === id);
                                return category ? category.name : '';
                              }).filter(Boolean).join(', ')
                            : 'Kategori seçin'}
                        </span>
                        <span className={`transition-transform duration-200 text-gray-400 flex-shrink-0 ml-1 ${isDropdownOpen ? 'transform rotate-180' : ''}`} style={{ fontSize: '10px' }}>▼</span>
                      </button>
                      
                      {/* Dropdown menu */}
                      {isDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-56 overflow-y-auto">
                          <div className="p-2">
                            {categories.map((category) => (
                              <div
                                key={category.id}
                                onClick={() => toggleCategory(category)}
                                className="flex items-center px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-700"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCategories.some(id => id === category.id)}
                                  onChange={() => {}}
                                  className="h-4 w-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-600"
                                />
                                <span className="ml-2 text-sm">{category.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={formGroupStyle}>
                    <label htmlFor="imageUpload" style={labelStyle}>
                      Kitap Kapak Resmi (Opsiyonel)
                    </label>
                    
                    {/* Resim yükleme bölümü */}
                    <div style={{
                      border: '1px dashed rgba(255, 255, 255, 0.3)',
                      borderRadius: '4px',
                      padding: '1rem',
                      marginBottom: '1rem',
                      textAlign: 'center',
                      backgroundColor: 'rgba(17, 24, 39, 0.4)'
                    }}>
                      {imageUrl ? (
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={imageUrl} 
                            alt="Kitap kapağı önizleme" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '150px', 
                              marginBottom: '0.5rem',
                              borderRadius: '4px'
                            }} 
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            style={{
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              background: 'rgba(0, 0, 0, 0.6)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            ×
                          </button>
                          <div style={{ marginTop: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0.5rem 1rem',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              Resmi Kaldır
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            id="imageUpload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                            disabled={isUploading}
                          />
                          <label
                            htmlFor="imageUpload"
                            style={{
                              display: 'block',
                              padding: '1rem',
                              border: '1px dashed rgba(255, 255, 255, 0.2)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: 'rgba(255, 255, 255, 0.7)',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {isUploading ? 'Resim Yükleniyor...' : 'Kitap kapak resmi seçmek için tıklayın'}
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={buttonContainerStyle}>
                  <button
                    type="submit"
                    style={{
                      ...primaryButtonStyle,
                      opacity: isSaving ? 0.7 : 1,
                    }}
                    disabled={isSaving}
                  >
                    {isSaving
                      ? 'Kaydediliyor...'
                      : editingBook
                        ? 'Kitabı Güncelle'
                        : 'Kitap Ekle'
                    }
                  </button>
                  
                  {editingBook && (
                    <button
                      type="button"
                      style={secondaryButtonStyle}
                      onClick={resetForm}
                    >
                      İptal
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            {/* Kitap listesi */}
            <h2 style={subtitleStyle}>Kitap Listesi</h2>
            
            {isLoading ? (
              <div style={loadingMessageStyle}>
                <p>Kitaplar yükleniyor...</p>
              </div>
            ) : books.length === 0 ? (
              <div style={loadingMessageStyle}>
                <p>Henüz kayıtlı kitap bulunmuyor.</p>
              </div>
            ) : (
              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>Başlık</th>
                      <th style={tableHeaderStyle}>Yazar</th>
                      <th style={tableHeaderStyle}>Yayın Yılı</th>
                      <th style={tableHeaderStyle}>Kategoriler</th>
                      <th style={tableHeaderStyle}>Durum</th>
                      <th style={tableHeaderStyle}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book, index) => (
                      <tr key={book.id} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-900'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img className="h-10 w-10 rounded-md object-cover" src={book.cover_image || "/placeholder-book.png"} alt={book.title} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{book.title}</div>
                              <div className="text-sm text-gray-400">{book.author}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{book.published}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400">{book.categories.map((cat: any) => cat.categoryId).join(', ')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-sm font-medium text-white rounded-full">
                            {book.available ? 'Müsait' : 'Ödünç Alındı'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <a href="#" className="text-indigo-400 hover:text-indigo-300">Edit</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 