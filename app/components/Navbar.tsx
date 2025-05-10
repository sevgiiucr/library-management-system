'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LoginModal, RegisterModal } from './AuthModals';

interface User {
  id: string;
  name: string;
  email: string;
  profileImageUrl?: string;
  role: string;
}

/**
 * Navbar Bileşeni
 * Uygulamanın üst kısmında yer alan gezinme çubuğu
 * Logo, sayfa linkleri, kullanıcı menüsü ve arama formu içerir
 * Mobil görünümde hamburger menü ikonu ve açılır kapanır menü içerir.
 */
export default function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: 'Tüm Kitaplar', href: '/books' },
    { name: 'Hakkında', href: '/about' }
  ];

  // Kullanıcı oturum durumunu kontrol et
  useEffect(() => {
    // Client tarafında localStorage'a erişim
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Kullanıcı bilgisi çözülemedi:', error);
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, [pathname]); // Pathname değiştiğinde kullanıcı durumunu tekrar kontrol et

  // Arama formunun gönderilmesi
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/books?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Modal işlemleri
  const handleOpenLoginModal = () => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
    setShowDropdown(false);
  };

  const handleOpenRegisterModal = () => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
    setShowDropdown(false);
  };

  const handleRegisterSuccess = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  // Çıkış yapma işlemi
  const handleLogout = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        
        // Sunucuda logout işlemi yap
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
        });
      }
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    }
    
    // Yerel depolamadaki bilgileri temizle
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setShowDropdown(false);
    router.push('/');
  };

  return (
    <nav className="navbar" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: 'transparent',
      borderBottom: 'none'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo - Sol tarafta */}
        <Link href="/" style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold',
          color: 'white',
          textDecoration: 'none'
        }}>
          <i>L&S</i>
        </Link>
        
        {/* Sağ taraf: Tüm diğer öğeler */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          {/* Ana Navigasyon Linkleri */}
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.2s',
                padding: '0.5rem 0'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              }}
            >
              {item.name}
            </Link>
          ))}
          
          {/* Admin Link - Yöneticiler için */}
          {isLoggedIn && user && user.role === 'admin' && (
            <Link href="/admin" style={{
              color: 'rgba(255, 255, 255, 0.8)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              transition: 'color 0.2s'
            }}>
              Admin
            </Link>
          )}
          
          {/* Profil Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              {isLoggedIn && user ? user.name.split(' ')[0] : 'Profil'}
              <span style={{ fontSize: '0.75rem', marginTop: '2px' }}>▼</span>
            </button>
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: 'rgba(26, 26, 26, 0.95)',
                borderRadius: '0.25rem',
                padding: '0.5rem',
                minWidth: '150px',
                marginTop: '0.5rem',
                zIndex: 51
              }}>
                {isLoggedIn ? (
                  <>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push('/dashboard');
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem',
                        color: 'white',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Profilim
                    </button>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem',
                        color: 'white',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Çıkış Yap
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleOpenLoginModal}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem',
                        color: 'white',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Giriş Yap
                    </button>
                    <button
                      onClick={handleOpenRegisterModal}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem',
                        color: 'white',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Kayıt Ol
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Arama Formu */}
          <form 
            onSubmit={handleSearch}
            style={{
              position: 'relative',
              width: '200px'
            }}
          >
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kitap ara..."
              style={{
                width: '100%',
                padding: '0.5rem 2rem 0.5rem 1rem',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            />
            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Login ve Register Modalları */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        openRegisterModal={handleOpenRegisterModal}
      />
      <RegisterModal 
        isOpen={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />
    </nav>
  );
}