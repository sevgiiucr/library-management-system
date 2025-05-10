'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { LoginModal, RegisterModal } from './components/AuthModals';
import { useRouter } from 'next/navigation';

/**
 * Ana Sayfa Bileşeni
 * Video arkaplan ve navbar'ı içerir
 */
export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showBooks, setShowBooks] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const router = useRouter();

  // Event listener for modal events
  useEffect(() => {
    // Login modal açma eventi için dinleyici
    const handleOpenLoginModal = () => {
      setShowLoginModal(true);
    };
    
    // Register modal açma eventi için dinleyici
    const handleOpenRegisterModal = () => {
      setShowRegisterModal(true);
    };
    
    // Event listener'ları ekle
    window.addEventListener('openLoginModal', handleOpenLoginModal);
    window.addEventListener('openRegisterModal', handleOpenRegisterModal);
    
    // Cleanup
    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal);
      window.removeEventListener('openRegisterModal', handleOpenRegisterModal);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
      setIsTablet(window.innerWidth <= 768);
    };

    // İlk yükleme için kontrol
    handleResize();

    // Ekran boyutu değiştiğinde kontrol
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    
    const startAnimation = () => {
      setVideoEnded(true);
      setTimeout(() => setShowBooks(true), 600);
      setTimeout(() => setShowCategories(true), 1200);
      setTimeout(() => setShowAbout(true), 1800);
    };

    if (video) {
      const timeoutId = setTimeout(() => {
        video.pause();
        startAnimation();
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, []);
  
  // Kayıt başarılı olduğunda login modalı aç
  const handleRegisterSuccess = () => {
    // Kısa bir gecikme ile login modalı aç
    setTimeout(() => {
      setShowLoginModal(true);
    }, 300);
  };

  // Profil kartına tıklandığında
  const handleProfileClick = () => {
    // localStorage'da token kontrolü yap
    const token = localStorage.getItem('token');
    
    if (token) {
      // Kullanıcı giriş yapmışsa dashboard'a yönlendir
      router.push('/dashboard');
    } else {
      // Kullanıcı giriş yapmamışsa login modalı aç
      setShowLoginModal(true);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', margin: 0, padding: 0 }}>
      <video 
        ref={videoRef}
        autoPlay 
        loop={false}
        muted 
        playsInline
        style={{
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          position: 'fixed',
          top: 0,
          left: 0,
          margin: 0,
          padding: 0
        }}
        src="/library-bg.mp4"
        onLoadedData={() => {
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.pause();
              setVideoEnded(true);
              setTimeout(() => setShowBooks(true), 400);
              setTimeout(() => setShowCategories(true), 800);
              setTimeout(() => setShowAbout(true), 1200);
            }
          }, 3000);
        }}
      />
      
      {/* Login ve Register Modalları */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        openRegisterModal={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />
      <RegisterModal 
        isOpen={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)}
        onRegisterSuccess={handleRegisterSuccess}
      />

      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: isTablet ? 'column' : 'row',
        gap: isTablet ? '1.5rem' : '2.5rem',
        zIndex: 10,
        width: '90%',
        maxWidth: '1200px',
        padding: '1rem',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Kitaplar Kutusu */}
        <Link href="/books" style={{
          width: isTablet ? '100%' : '32%',
          flex: isTablet ? 'none' : '1',
          minWidth: isTablet ? 'none' : '300px',
          display: 'block'
        }}>
          <div style={{
            width: '100%',
            height: isMobile ? '300px' : '400px',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '1rem',
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.8s ease-in-out',
            cursor: 'pointer',
            opacity: showBooks ? 1 : 0,
            transform: `translateY(${showBooks ? '0' : '70px'}) scale(${showBooks ? '1' : '0.95'})`,
            visibility: showBooks ? 'visible' : 'hidden',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-15px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 20px 30px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.transition = 'all 0.8s ease-in-out';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
            e.currentTarget.style.transition = 'all 0.8s ease-in-out';
          }}
          >
            <img
              src="/books.jpg"
              alt="Kitaplar"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '1.5rem',
              background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
              color: 'white'
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: isMobile ? '1.25rem' : '1.5rem' 
              }}>
                Tüm Kitaplar
              </h3>
              <p style={{
                margin: '0.5rem 0 0 0', 
                fontSize: isMobile ? '0.8rem' : '0.9rem' 
              }}>
                Kütüphane ve Open Library kitaplarını keşfedin
              </p>
            </div>
          </div>
        </Link>
        
        {/* Kategoriler Kutusu */}
        <div style={{
          width: isTablet ? '100%' : '32%',
          flex: isTablet ? 'none' : '1',
          minWidth: isTablet ? 'none' : '300px',
          display: 'block'
        }}>
          <div 
            onClick={handleProfileClick}
            style={{
            width: '100%',
            height: isMobile ? '300px' : '400px',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '1rem',
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.8s ease-in-out',
            cursor: 'pointer',
            opacity: showCategories ? 1 : 0,
            transform: `translateY(${showCategories ? '0' : '70px'}) scale(${showCategories ? '1' : '0.95'})`,
            visibility: showCategories ? 'visible' : 'hidden',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}
            onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-15px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 20px 30px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.transition = 'all 0.8s ease-in-out';
            }}
            onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
            e.currentTarget.style.transition = 'all 0.8s ease-in-out';
          }}
          >
            <img
              src="/prf.jpg"
              alt="Profil"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '1.5rem',
              background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
              color: 'white'
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: isMobile ? '1.25rem' : '1.5rem' 
              }}>
                Profil
              </h3>
              <p style={{ 
                margin: '0.5rem 0 0 0', 
                fontSize: isMobile ? '0.8rem' : '0.9rem' 
              }}>
                Profil sayfanıza erişin
              </p>
            </div>
          </div>
        </div>
        
        {/* Hakkında Kutusu */}
        <Link href="/about" style={{
          width: isTablet ? '100%' : '32%',
          flex: isTablet ? 'none' : '1',
          minWidth: isTablet ? 'none' : '300px',
          display: 'block'
        }}>
          <div style={{
            width: '100%',
            height: isMobile ? '300px' : '400px',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '1rem',
            overflow: 'hidden',
            position: 'relative',
            transition: 'all 0.8s ease-in-out',
            cursor: 'pointer',
            opacity: showAbout ? 1 : 0,
            transform: `translateY(${showAbout ? '0' : '70px'}) scale(${showAbout ? '1' : '0.95'})`,
            visibility: showAbout ? 'visible' : 'hidden',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}
            onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-15px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 20px 30px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.transition = 'all 0.8s ease-in-out';
            }}
            onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
            e.currentTarget.style.transition = 'all 0.8s ease-in-out';
          }}
          >
            <img
              src="/about.jpg"
              alt="Hakkında"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '1.5rem',
              background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
              color: 'white'
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: isMobile ? '1.25rem' : '1.5rem' 
              }}>
                Hakkında
              </h3>
              <p style={{ 
                margin: '0.5rem 0 0 0', 
                fontSize: isMobile ? '0.8rem' : '0.9rem' 
              }}>
                Kütüphane hakkında bilgi alın
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
