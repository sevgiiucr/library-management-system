'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';

interface Stats {
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  totalUsers: number;
  totalBorrows: number;
  activeBorrows: number;
  mostBorrowedBooks: {
    id: string;
    title: string;
    author: string;
    borrowCount: number;
  }[];
  mostActiveUsers: {
    id: string;
    name: string;
    email: string;
    borrowCount: number;
  }[];
  recentBorrows?: number;
  dailyTransactions?: number;
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Hover state için yeni state değişkenleri
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredBook, setHoveredBook] = useState<string | null>(null);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);

  // Kullanıcı token'ını al ve yetkisini kontrol et
  useEffect(() => {
    console.log("Admin kontrolü başlatılıyor...");
    
    // Token kontrolü
    const token = localStorage.getItem('accessToken');
    setUserToken(token);
    
    if (!token) {
      console.log("Token bulunamadı, admin değil");
      setIsAdmin(false);
      return;
    }

    // Kullanıcı verilerini kontrol et
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log("Kullanıcı verileri bulunamadı, admin değil");
      setIsAdmin(false);
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      console.log("Kullanıcı rolü:", userData.role);
      
      // Kullanıcı admin mi?
      if (userData.role.toLowerCase() === 'admin') {
        console.log("Kullanıcı admin, sayfa yükleniyor");
        setIsAdmin(true);
      } else {
        console.log("Kullanıcı admin değil");
        setIsAdmin(false);
      }
    } catch (e) {
      console.error("Kullanıcı verilerini ayrıştırma hatası:", e);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    
    const fetchStats = async () => {
      if (!isAdmin || !userToken) return;
      
      setLoading(true);
      setError("");

      try {
        const response = await fetch('/api/stats', {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.log("Falling back to client-side calculation");
          
          try {
            console.log("Fetching books data...");
            const booksResponse = await fetch('/api/books', {
              headers: {
                'Authorization': `Bearer ${userToken}`
              }
            });
            console.log("Books API response:", booksResponse.status, booksResponse.statusText);
            
            console.log("Fetching users data...");
            const usersResponse = await fetch('/api/users', {
              headers: {
                'Authorization': `Bearer ${userToken}`
              }
            });
            console.log("Users API response:", usersResponse.status, usersResponse.statusText);
            
            console.log("Fetching borrows data...");
            const borrowsResponse = await fetch('/api/borrows', {
              headers: {
                'Authorization': `Bearer ${userToken}`
              }
            });
            console.log("Borrows API response:", borrowsResponse.status, borrowsResponse.statusText);
            
            // Check each API response individually
            if (!booksResponse.ok) {
              setError(`Kitap verileri alınamadı: ${booksResponse.status} ${booksResponse.statusText}`);
              setLoading(false);
              return;
            }
            
            if (!usersResponse.ok) {
              setError(`Kullanıcı verileri alınamadı: ${usersResponse.status} ${usersResponse.statusText}`);
              setLoading(false);
              return;
            }
            
            if (!borrowsResponse.ok) {
              setError(`Ödünç alma verileri alınamadı: ${borrowsResponse.status} ${borrowsResponse.statusText}`);
              setLoading(false);
              return;
            }

            console.log("All API responses successful, parsing JSON...");
            const books = await booksResponse.json();
            const users = await usersResponse.json();
            const borrows = await borrowsResponse.json();
            console.log("Data fetched successfully. Counts:", {
              books: books.length,
              users: users.length,
              borrows: borrows.length
            });
            
            const totalBooks = books.length;
            const availableBooks = books.filter((book: any) => !book.borrowed).length;
            const borrowedBooks = totalBooks - availableBooks;
            const totalUsers = users.length;
            const totalBorrows = borrows.length;
            const activeBorrows = borrows.filter((borrow: any) => !borrow.returnDate).length;
            
            // Son 24 saat içindeki işlemler
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
            
            // Son 24 saatteki ödünç alma sayısı
            const dailyBorrows = borrows.filter((borrow: any) => 
              new Date(borrow.borrowDate) >= twentyFourHoursAgo
            ).length;
            
            // Son 24 saatteki iade sayısı
            const dailyReturns = borrows.filter((borrow: any) => 
              borrow.returnDate && new Date(borrow.returnDate) >= twentyFourHoursAgo
            ).length;
            
            // Toplam günlük işlem sayısı
            const dailyTransactions = dailyBorrows + dailyReturns;
            
            // Güvenli şekilde kitap ödünç sayılarını hesaplama
            const bookBorrowCounts: Record<string, {count: number, book: any}> = {};
            
            books.forEach((book: any) => {
              bookBorrowCounts[book.id] = { count: 0, book };
            });
            
            borrows.forEach((borrow: any) => {
              if (bookBorrowCounts[borrow.bookId]) {
                bookBorrowCounts[borrow.bookId].count++;
              }
            });
            
            const mostBorrowedBooks = Object.values(bookBorrowCounts)
              .sort((a: any, b: any) => b.count - a.count)
              .slice(0, 5)
              .map((item: any) => ({
                id: item.book.id,
                title: item.book.title,
                author: item.book.author,
                borrowCount: item.count
              }));
            
            const userBorrowCounts: Record<string, {count: number, user: any}> = {};
            borrows.forEach((borrow: any) => {
              if (!userBorrowCounts[borrow.userId]) {
                userBorrowCounts[borrow.userId] = {
                  count: 0,
                  user: users.find((u: any) => u.id === borrow.userId)
                };
              }
              userBorrowCounts[borrow.userId].count++;
            });
            
            const mostActiveUsers = Object.values(userBorrowCounts)
              .sort((a: any, b: any) => b.count - a.count)
              .slice(0, 5)
              .map((item: any) => ({
                id: item.user.id,
                name: item.user.name,
                email: item.user.email,
                borrowCount: item.count
              }));
            
            setStats({
              totalBooks,
              availableBooks,
              borrowedBooks,
              totalUsers,
              totalBorrows,
              activeBorrows,
              mostBorrowedBooks,
              mostActiveUsers,
              dailyTransactions
            });
          } catch (err) {
            console.error("Error fetching stats:", err);
            setError("İstatistikler yüklenirken bir hata oluştu.");
          }
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("İstatistikler yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    
    if (isClient) {
      fetchStats();
    }
  }, [isClient, isAdmin, userToken]);

  // Admin değilse erişim reddedildi mesajı göster
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto', 
          padding: '2rem 1rem',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: '2rem', 
            marginBottom: '1rem', 
            color: '#ef4444'
          }}>
            Erişim Reddedildi
          </h1>
          <p style={{ 
            fontSize: '1.125rem', 
            marginBottom: '2rem',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            Bu sayfaya erişmek için admin yetkilerine sahip olmanız gerekmektedir.
          </p>
          <Link href="/" style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            color: '#ffffff',
            borderRadius: '0.375rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease-in-out',
            fontSize: '0.875rem',
            textDecoration: 'none',
            marginBottom: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  // Hala kontrol ediliyorsa yükleniyor göster
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto', 
          padding: '2rem 1rem',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: '2rem', 
            marginBottom: '1rem'
          }}>
            Yetki Kontrol Ediliyor...
          </h1>
          <div style={{ 
            display: 'inline-block',
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            borderTop: '3px solid #3b82f6',
            borderRight: '3px solid transparent',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff' }}>
      <Navbar />
      
      {/* Admin Menü */}
      <div style={{ backgroundColor: '#1f2937', borderBottom: '1px solid #374151' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', marginBottom: '1rem' }}>Admin Panel</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <Link href="/admin" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', color: '#d1d5db', backgroundColor: 'transparent' }}>Dashboard</Link>
              <Link href="/admin/books" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', color: '#d1d5db', backgroundColor: 'transparent' }}>Kitaplar</Link>
              <Link href="/admin/users" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', color: '#d1d5db', backgroundColor: 'transparent' }}>Kullanıcılar</Link>
              <Link href="/admin/borrows" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', color: '#d1d5db', backgroundColor: 'transparent' }}>Ödünç Alma</Link>
              <Link href="/admin/reports" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', color: '#fff', backgroundColor: '#4f46e5', fontWeight: '500' }}>Raporlar</Link>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#fff', marginBottom: '2rem', borderBottom: '1px solid #3730a3', paddingBottom: '1rem' }}>Kütüphane Rapor Paneli</h1>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '16rem' }}>
            <div style={{ animation: 'spin 1s linear infinite', borderRadius: '50%', height: '4rem', width: '4rem', borderTop: '4px solid #4f46e5', borderBottom: '4px solid #4f46e5' }}></div>
            <span style={{ marginLeft: '1rem', color: '#818cf8' }}>Veriler yükleniyor...</span>
          </div>
        ) : error ? (
          <div style={{ backgroundColor: 'rgba(127, 29, 29, 0.3)', border: '1px solid #991b1b', padding: '1.5rem', borderRadius: '0.375rem', textAlign: 'center', margin: '2rem 0' }}>
            <p style={{ fontSize: '1.5rem', color: '#fca5a5', marginBottom: '0.5rem', fontWeight: '600' }}>Hata Oluştu</p>
            <p style={{ color: '#fecaca' }}>{error}</p>
          </div>
        ) : stats ? (
          <>
            {/* Ana İstatistikler */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div 
                style={{ 
                  backgroundColor: hoveredCard === 0 ? '#15337a' : '#1e3a8a', 
                  padding: '1.5rem', 
                  borderRadius: '0.75rem', 
                  border: '1px solid #1e40af',
                  transition: 'all 0.3s ease',
                  transform: hoveredCard === 0 ? 'translateY(-5px)' : 'translateY(0)',
                  boxShadow: hoveredCard === 0 ? '0 10px 25px -5px rgba(59, 130, 246, 0.5)' : 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredCard(0)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#93c5fd', fontWeight: '500' }}>Toplam Kitap</p>
                    <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#fff', marginTop: '0.5rem' }}>{stats.totalBooks}</h3>
                  </div>
                  <div style={{ backgroundColor: '#1e40af', padding: '0.75rem', borderRadius: '9999px', border: '1px solid #2563eb' }}>
                    📚
                  </div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#bfdbfe' }}>
                  <span style={{ fontWeight: '500' }}>{stats.availableBooks} kitap mevcut,</span> {stats.borrowedBooks || stats.activeBorrows} kitap ödünç verilmiş
                </div>
              </div>
              
              <div 
                style={{ 
                  backgroundColor: hoveredCard === 1 ? '#054c37' : '#065f46', 
                  padding: '1.5rem', 
                  borderRadius: '0.75rem', 
                  border: '1px solid #047857',
                  transition: 'all 0.3s ease',
                  transform: hoveredCard === 1 ? 'translateY(-5px)' : 'translateY(0)',
                  boxShadow: hoveredCard === 1 ? '0 10px 25px -5px rgba(5, 150, 105, 0.5)' : 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredCard(1)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                    <p style={{ fontSize: '0.875rem', color: '#6ee7b7', fontWeight: '500' }}>Toplam Kullanıcı</p>
                    <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#fff', marginTop: '0.5rem' }}>{stats.totalUsers}</h3>
                      </div>
                  <div style={{ backgroundColor: '#047857', padding: '0.75rem', borderRadius: '9999px', border: '1px solid #059669' }}>
                    👥
                      </div>
                    </div>
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#a7f3d0' }}>
                  <span style={{ fontWeight: '500' }}>{stats.totalUsers} kullanıcı,</span> {stats.activeBorrows} aktif ödünç
                      </div>
                    </div>
                    
              <div 
                style={{ 
                  backgroundColor: hoveredCard === 2 ? '#3b1583' : '#4c1d95', 
                  padding: '1.5rem', 
                  borderRadius: '0.75rem', 
                  border: '1px solid #5b21b6',
                  transition: 'all 0.3s ease',
                  transform: hoveredCard === 2 ? 'translateY(-5px)' : 'translateY(0)',
                  boxShadow: hoveredCard === 2 ? '0 10px 25px -5px rgba(109, 40, 217, 0.5)' : 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredCard(2)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                    <p style={{ fontSize: '0.875rem', color: '#c4b5fd', fontWeight: '500' }}>Toplam Ödünç</p>
                    <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#fff', marginTop: '0.5rem' }}>{stats.totalBorrows}</h3>
                      </div>
                  <div style={{ backgroundColor: '#5b21b6', padding: '0.75rem', borderRadius: '9999px', border: '1px solid #6d28d9' }}>
                    📊
                  </div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#ddd6fe' }}>
                  <span style={{ fontWeight: '500' }}>{stats.activeBorrows} aktif,</span> {stats.totalBorrows - stats.activeBorrows} tamamlanmış
                      </div>
                    </div>
                    
              <div 
                style={{ 
                  backgroundColor: hoveredCard === 3 ? '#63300d' : '#78350f', 
                  padding: '1.5rem', 
                  borderRadius: '0.75rem', 
                  border: '1px solid #92400e',
                  transition: 'all 0.3s ease',
                  transform: hoveredCard === 3 ? 'translateY(-5px)' : 'translateY(0)',
                  boxShadow: hoveredCard === 3 ? '0 10px 25px -5px rgba(180, 83, 9, 0.5)' : 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredCard(3)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#fcd34d', fontWeight: '500' }}>Günlük İşlem</p>
                    <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#fff', marginTop: '0.5rem' }}>
                      {stats.dailyTransactions ? stats.dailyTransactions : 0}
                    </h3>
                      </div>
                  <div style={{ backgroundColor: '#92400e', padding: '0.75rem', borderRadius: '9999px', border: '1px solid #b45309' }}>
                    🕒
                  </div>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#fde68a' }}>
                  <span style={{ fontWeight: '500' }}>Son 24 saatte yapılan işlemler</span>
                </div>
              </div>
            </div>
            
            {/* Popüler İçerik Bölümleri */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '1.5rem', borderRadius: '0.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', marginBottom: '1.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.75rem' }}>En Çok Ödünç Alınan Kitaplar</h3>
                
                {stats.mostBorrowedBooks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {stats.mostBorrowedBooks.map((book, index) => (
                      <div 
                        key={index} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '0.75rem', 
                          backgroundColor: hoveredBook === book.id ? '#1f2937' : '#374151', 
                          borderRadius: '0.5rem', 
                          border: '1px solid #4b5563',
                          transition: 'all 0.3s ease',
                          transform: hoveredBook === book.id ? 'translateY(-3px)' : 'translateY(0)',
                          boxShadow: hoveredBook === book.id ? '0 10px 15px -3px rgba(55, 65, 81, 0.5)' : 'none',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={() => setHoveredBook(book.id)}
                        onMouseLeave={() => setHoveredBook(null)}
                      >
                        <div style={{ flexShrink: 0, backgroundColor: '#3730a3', borderRadius: '0.5rem', padding: '0.5rem' }}>
                          📚
                        </div>
                        <div style={{ marginLeft: '1rem', flexGrow: 1 }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#fff' }}>{book.title}</h4>
                          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{book.author}</p>
                        </div>
                        <div style={{ flexShrink: 0, backgroundColor: '#312e81', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: '500', padding: '0.25rem 0.625rem', borderRadius: '9999px', border: '1px solid #4338ca' }}>
                          {book.borrowCount} ödünç
                        </div>
                            </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '12rem' }}>
                    <p style={{ color: '#9ca3af' }}>Henüz veri bulunmamaktadır.</p>
                </div>
                )}
              </div>
              
              <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '1.5rem', borderRadius: '0.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', marginBottom: '1.5rem', borderBottom: '1px solid #374151', paddingBottom: '0.75rem' }}>En Aktif Kullanıcılar</h3>
                
                {stats.mostActiveUsers.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {stats.mostActiveUsers.map((user, index) => (
                      <div 
                        key={index} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          padding: '0.75rem', 
                          backgroundColor: hoveredUser === user.id ? '#1f2937' : '#374151', 
                          borderRadius: '0.5rem', 
                          border: '1px solid #4b5563',
                          transition: 'all 0.3s ease',
                          transform: hoveredUser === user.id ? 'translateY(-3px)' : 'translateY(0)',
                          boxShadow: hoveredUser === user.id ? '0 10px 15px -3px rgba(55, 65, 81, 0.5)' : 'none',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={() => setHoveredUser(user.id)}
                        onMouseLeave={() => setHoveredUser(null)}
                      >
                        <div style={{ flexShrink: 0, backgroundColor: '#065f46', borderRadius: '9999px', height: '2.5rem', width: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #047857' }}>
                          <span style={{ color: '#6ee7b7', fontWeight: '600' }}>{user.name.charAt(0)}</span>
                        </div>
                        <div style={{ marginLeft: '1rem', flexGrow: 1 }}>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#fff' }}>{user.name}</h4>
                          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{user.email}</p>
                              </div>
                        <div style={{ flexShrink: 0, backgroundColor: '#065f46', color: '#6ee7b7', fontSize: '0.75rem', fontWeight: '500', padding: '0.25rem 0.625rem', borderRadius: '9999px', border: '1px solid #047857' }}>
                          {user.borrowCount} kitap
                              </div>
                            </div>
                    ))}
                </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '12rem' }}>
                    <p style={{ color: '#9ca3af' }}>Henüz veri bulunmamaktadır.</p>
              </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ fontSize: '1.25rem', color: '#9ca3af' }}>Veri bulunamadı.</p>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 