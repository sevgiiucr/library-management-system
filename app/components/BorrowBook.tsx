'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface BorrowBookProps {
  bookId: string;
  isAvailable: boolean;
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

export default function BorrowBook({ bookId, isAvailable, currentBorrow }: BorrowBookProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Component yüklendiğinde kullanıcı bilgilerini local storage'dan al
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error);
      }
    }
  }, []);
  
  // JWT'den userId çıkarmak için yardımcı fonksiyon
  const getUserIdFromToken = (token: string): string | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch {
      return null;
    }
  };
  
  const handleBorrowBook = async () => {
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Oturum açmanız gerekiyor');
        router.push('/login');
        return;
      }
      
      const userId = getUserIdFromToken(token);
      if (!userId) {
        toast.error('Kullanıcı kimliği bulunamadı');
        return;
      }
      
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'borrow',
          userId
        })
      });
      
      if (response.ok) {
        toast.success('Kitap başarıyla ödünç alındı');
        router.refresh();
        
        // İsteğe bağlı olarak dashboard'a yönlendirme
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Kitap ödünç alınamadı');
      }
    } catch (error) {
      console.error('Kitap ödünç alma hatası:', error);
      toast.error('Bir hata oluştu, lütfen tekrar deneyin');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleReturnBook = async () => {
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Oturum açmanız gerekiyor');
        router.push('/login');
        return;
      }
      
      const userId = getUserIdFromToken(token);
      if (!userId) {
        toast.error('Kullanıcı kimliği bulunamadı');
        return;
      }
      
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'return',
          userId
        })
      });
      
      if (response.ok) {
        toast.success('Kitap başarıyla iade edildi');
        router.refresh();
        
        // İsteğe bağlı olarak dashboard'a yönlendirme
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Kitap iade edilemedi');
      }
    } catch (error) {
      console.error('Kitap iade hatası:', error);
      toast.error('Bir hata oluştu, lütfen tekrar deneyin');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Mevcut kullanıcı kitabı ödünç almış mı kontrol et
  const isCurrentUserBorrower = currentBorrow && currentUserId && currentBorrow.userId === currentUserId;
  
  if (isAvailable) {
    return (
      <button
        onClick={handleBorrowBook}
        disabled={isProcessing}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 16px',
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          cursor: isProcessing ? 'wait' : 'pointer',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          gap: '6px'
        }}
        onMouseOver={(e) => {
          if (!isProcessing) {
            e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.95)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }
        }}
        onMouseOut={(e) => {
          if (!isProcessing) {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }
        }}
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            İşlem yapılıyor...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M12 19L6 13M12 19L18 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Ödünç Al
          </>
        )}
      </button>
    );
  }
  
  if (isCurrentUserBorrower) {
    return (
      <button
        onClick={handleReturnBook}
        disabled={isProcessing}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 16px',
          backgroundColor: 'rgba(16, 185, 129, 0.9)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          cursor: isProcessing ? 'wait' : 'pointer',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          gap: '6px'
        }}
        onMouseOver={(e) => {
          if (!isProcessing) {
            e.currentTarget.style.backgroundColor = 'rgba(5, 150, 105, 0.95)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }
        }}
        onMouseOut={(e) => {
          if (!isProcessing) {
            e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.9)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
          }
        }}
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            İşlem yapılıyor...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M12 5L6 11M12 5L18 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            İade Et
          </>
        )}
      </button>
    );
  }
  
  // Kitap başkası tarafından ödünç alınmış ve güncel kullanıcı ödünç alan değilse
  return (
    <button
      disabled
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px',
        backgroundColor: 'rgba(75, 85, 99, 0.6)',
        color: 'rgba(255, 255, 255, 0.8)',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'not-allowed',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        gap: '6px',
        opacity: 0.8
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 11v-5.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v3.5h-8c-1.66 0-3 1.34-3 3v7c0 1.66 1.34 3 3 3h9c1.66 0 3-1.34 3-3v-7c0-.85-.35-1.61-.91-2.16-.56-.54-1.32-.84-2.09-.84z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Ödünç Alındı
    </button>
  );
} 