'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '@/app/globals.css';
import { ClipboardIcon, BookOpenIcon, ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Borrow {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  book: {
    id: string;
    title: string;
    author: string;
  };
  borrowDate: string;
  returnDate: string | null;
}

export default function AdminBorrowsPage() {
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [filteredBorrows, setFilteredBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'returned'>('all');
  const router = useRouter();

  // Kullanıcı token'ını al ve yetkisini kontrol et
  useEffect(() => {
    const token = localStorage.getItem('token');
    setUserToken(token);
    
    if (!token) {
      router.push('/');
      return;
    }

    // Admin yetkisini kontrol et
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/auth/check-admin', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          router.push('/');
        }
      } catch (err) {
        console.error('Yetki kontrolü hatası:', err);
        router.push('/');
      }
    };
    
    checkAdmin();
  }, [router]);

  // Ödünç alma kayıtlarını getir
  useEffect(() => {
    const fetchBorrows = async () => {
      if (!userToken) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/borrows', {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data) && data.length > 0) {
            setBorrows(data);
            setFilteredBorrows(data);
            setError(null);
          } else {
            // Boş veri - gerçek veri kullan
            setBorrows([]);
            setFilteredBorrows([]);
            setError("Henüz ödünç kayıtı bulunmuyor.");
          }
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Ödünç alma kayıtları getirilirken bir hata oluştu');
        }
      } catch (err) {
        console.error('Ödünç alma kayıtları getirme hatası:', err);
        setError('Ödünç alma kayıtları getirilirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    
    if (userToken) {
      fetchBorrows();
    }
  }, [userToken]);

  // Filter and search logic
  useEffect(() => {
    let result = [...borrows];
    
    // Apply status filter
    if (filterStatus === 'active') {
      result = result.filter(borrow => !borrow.returnDate);
    } else if (filterStatus === 'returned') {
      result = result.filter(borrow => borrow.returnDate);
    }
    
    // Apply search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(borrow => 
        borrow.user.name.toLowerCase().includes(searchLower) ||
        borrow.user.email.toLowerCase().includes(searchLower) ||
        borrow.book.title.toLowerCase().includes(searchLower) ||
        borrow.book.author.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredBorrows(result);
  }, [borrows, searchTerm, filterStatus]);

  const handleReturnBook = async (borrowId: string) => {
    if (!userToken) return;
    
    try {
      const response = await fetch(`/api/borrows/${borrowId}/return`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (response.ok) {
        // Başarıyla iade edildi, listeyi güncelle
        setBorrows(borrows.map(borrow => 
          borrow.id === borrowId 
            ? { ...borrow, returnDate: new Date().toISOString() } 
            : borrow
        ));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Kitap iade edilirken bir hata oluştu');
      }
    } catch (err) {
      console.error('Kitap iade hatası:', err);
      alert('Kitap iade edilirken bir hata oluştu');
    }
  };

  const getReturnRate = () => {
    if (borrows.length === 0) return 0;
    const returnedCount = borrows.filter(b => b.returnDate).length;
    return Math.round((returnedCount / borrows.length) * 100);
  };

  const getAverageBorrowDays = () => {
    const returnedBorrows = borrows.filter(b => b.returnDate);
    if (returnedBorrows.length === 0) return 0;
    
    const totalDays = returnedBorrows.reduce((total, borrow) => {
      const borrowDate = new Date(borrow.borrowDate);
      const returnDate = new Date(borrow.returnDate as string);
      const diffTime = Math.abs(returnDate.getTime() - borrowDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return total + diffDays;
    }, 0);
    
    return Math.round(totalDays / returnedBorrows.length);
  };

  // JSX renders the borrow data table rows
  const renderBorrowRows = () => {
    return filteredBorrows.map((borrow) => {
      const isOverdue = !borrow.returnDate && new Date(borrow.borrowDate) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const isReturned = !!borrow.returnDate;
      
      return (
        <tr key={borrow.id} className="admin-table-tr bg-gray-800/60">
          <td className="admin-table-td">
            <div className="flex items-center">
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white mr-4 text-lg font-bold shadow-lg shadow-blue-900/20">
                {borrow.user.name.substring(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-white text-base">{borrow.user.name}</div>
                <div className="text-sm text-gray-300">{borrow.user.email}</div>
              </div>
            </div>
          </td>
          <td className="admin-table-td">
            <div>
              <div className="font-medium text-white text-base">{borrow.book.title}</div>
              <div className="text-sm text-gray-300">{borrow.book.author}</div>
            </div>
          </td>
          <td className="admin-table-td">
            <div className="text-sm text-white">
              {new Date(borrow.borrowDate).toLocaleDateString('tr-TR')}
            </div>
          </td>
          <td className="admin-table-td">
            {isReturned ? (
              <div className="text-sm text-white">
                {new Date(borrow.returnDate as string).toLocaleDateString('tr-TR')}
              </div>
            ) : (
              <div className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${
                isOverdue ? 'bg-red-600/30 text-red-300 border border-red-700/30' : 'bg-amber-600/30 text-amber-300 border border-amber-700/30'
              }`}>
                {isOverdue ? 'Gecikmiş' : 'İade Edilmedi'}
              </div>
            )}
          </td>
          <td className="admin-table-td text-right">
            {!isReturned && (
              <button
                onClick={() => handleReturnBook(borrow.id)}
                className="admin-button admin-button-green text-xs px-3.5 py-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                İade Et
              </button>
            )}
            <button className="ml-3 admin-button admin-button-gray text-xs px-3.5 py-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Detaylar
            </button>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="admin-container">
      {/* Content Container */}
      <div className="admin-content">
        {/* Admin Menü Bar */}
        <div className="admin-menu-bar">
          <div className="admin-menu-bar-inner">
            <div className="admin-menu-flex">
              <h2 className="admin-menu-title">Admin Panel</h2>
              <div className="admin-menu-links">
                <Link href="/admin" className="admin-menu-link">Dashboard</Link>
                <Link href="/admin/books" className="admin-menu-link">Kitaplar</Link>
                <Link href="/admin/users" className="admin-menu-link">Kullanıcılar</Link>
                <Link href="/admin/borrows" className="admin-menu-link admin-menu-link-active">Ödünç Alma</Link>
                <Link href="/admin/reports" className="admin-menu-link">Raporlar</Link>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="mb-10">
            <h1 className="admin-title">Ödünç Alma Yönetimi</h1>
            <p className="admin-subtitle">Kütüphane ödünç alma işlemlerini bu sayfadan yönetebilirsiniz.</p>
            
            {/* Stats Cards */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card admin-stat-card-blue">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider font-medium">Toplam İşlem</p>
                    <h3 className="text-2xl font-semibold text-white mt-2">{borrows.length}</h3>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <ClipboardIcon className="h-7 w-7 text-blue-400" />
                  </div>
                </div>
                <div className="admin-stat-indicator admin-stat-indicator-blue"></div>
              </div>
              
              <div className="admin-stat-card admin-stat-card-green">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider font-medium">Aktif Ödünç</p>
                    <h3 className="text-2xl font-semibold text-white mt-2">{borrows.filter(b => !b.returnDate).length}</h3>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <BookOpenIcon className="h-7 w-7 text-green-400" />
                  </div>
                </div>
                <div className="admin-stat-indicator admin-stat-indicator-green"></div>
              </div>
              
              <div className="admin-stat-card admin-stat-card-purple">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider font-medium">İade Oranı</p>
                    <h3 className="text-2xl font-semibold text-white mt-2">{getReturnRate()}%</h3>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <ChartBarIcon className="h-7 w-7 text-purple-400" />
                  </div>
                </div>
                <div className="admin-stat-indicator admin-stat-indicator-purple"></div>
              </div>
              
              <div className="admin-stat-card admin-stat-card-amber">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider font-medium">Ort. Ödünç Gün</p>
                    <h3 className="text-2xl font-semibold text-white mt-2">{getAverageBorrowDays()}</h3>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl">
                    <ClockIcon className="h-7 w-7 text-amber-400" />
                  </div>
                </div>
                <div className="admin-stat-indicator admin-stat-indicator-amber"></div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="admin-search-filter">
              <div className="admin-search-container">
                <input
                  type="text"
                  placeholder="Kullanıcı veya kitap ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="admin-search-input pl-4"
                />
              </div>
              <div>
                <select
                  className="admin-filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "returned")}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="admin-loading">
              <div className="admin-loading-spinner">
                <div className="admin-loading-spinner-outer"></div>
                <div className="admin-loading-spinner-inner"></div>
              </div>
              <p className="admin-loading-text">Veriler yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="admin-error">
              <div className="admin-error-icon-container">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="admin-error-title">Hata Oluştu</p>
              <p className="admin-error-message">{error}</p>
            </div>
          ) : (
            <>
              {/* Borrows Table */}
              <div className="admin-table-container">
                {filteredBorrows.length === 0 ? (
                  <div className="admin-empty-state">
                    <div className="admin-empty-icon-container">
                      <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="admin-empty-title">Kayıt Bulunamadı</h3>
                    <p className="admin-empty-text">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Arama sonuçlarına uygun kayıt bulunamadı. Lütfen filtreleri değiştirin veya farklı bir arama terimi deneyin.' 
                        : 'Henüz kaydedilmiş ödünç alma işlemi bulunmuyor. Yeni bir ödünç alma işlemi başlatmak için "Yeni Ödünç Ver" butonunu kullanabilirsiniz.'}
                    </p>
                    {(searchTerm || filterStatus !== 'all') && (
                      <button 
                        onClick={() => {setSearchTerm(''); setFilterStatus('all');}}
                        className="admin-button admin-button-blue"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Filtreleri Temizle
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="admin-table-header">
                      <h3 className="admin-table-title">Ödünç Kayıtları</h3>
                      <span className="admin-table-counter">
                        {filteredBorrows.length} kayıt
                      </span>
                    </div>
                    <div className="overflow-x-auto w-full">
                      <table className="admin-table">
                        <thead className="admin-table-thead">
                          <tr>
                            <th className="admin-table-th">Kullanıcı</th>
                            <th className="admin-table-th">Kitap</th>
                            <th className="admin-table-th">Ödünç Tarihi</th>
                            <th className="admin-table-th">İade Tarihi</th>
                            <th className="admin-table-th text-right">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody className="admin-table-tbody">
                          {renderBorrowRows()}
                        </tbody>
                      </table>
                    </div>
                    <div className="admin-table-footer">
                      <div className="text-gray-400">
                        Toplam <span className="font-medium text-white">{borrows.length}</span> kayıttan <span className="font-medium text-white">{filteredBorrows.length}</span> tanesi gösteriliyor
                      </div>
                      <div className="admin-pagination">
                        <button disabled className="admin-pagination-btn">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button className="admin-pagination-btn admin-pagination-btn-active">1</button>
                        <button disabled className="admin-pagination-btn">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 