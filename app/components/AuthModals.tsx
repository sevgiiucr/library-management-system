'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Temel AuthModal bileşeni
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden'; 
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      document.body.style.overflow = 'auto';
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingTop: '100px'
    }} onClick={onClose}>
      <div style={{
        position: 'relative',
        backgroundColor: 'rgba(30, 41, 59, 0.85)',
        width: '90%', 
        maxWidth: '450px',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(30, 40, 56, 0.18)'
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          {title}
        </h2>
        
        {description && (
          <p style={{
            color: '#94a3b8',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            {description}
          </p>
        )}
        
        <div>
          {children}
        </div>

        <button
          onClick={onClose}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '16px',
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Kapat
        </button>
      </div>
    </div>
  );
};

/**
 * Giriş Yapma Modal Bileşeni
 */
export function LoginModal({ 
  isOpen, 
  onClose, 
  openRegisterModal 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  openRegisterModal?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  // Modal kapatıldığında formu sıfırla
  useEffect(() => {
    if (!isOpen) {
      setError('');
    }
  }, [isOpen]);

  // Form gönderildiğinde
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Kullanıcı adı veya şifre hatalı');
      }
      
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setTimeout(() => {
        onClose();
        router.replace('/dashboard');
      }, 100);
    } catch (err: any) {
      console.error('Giriş hatası:', err);
      setError(err.message || 'Bağlantı hatası. Lütfen tekrar deneyin');
    } finally {
      setLoading(false);
    }
  };
  
  const switchToRegister = () => {
    if (openRegisterModal) {
      onClose();
      openRegisterModal();
    } else {
      onClose();
      const event = new CustomEvent('openRegisterModal');
      window.dispatchEvent(event);
    }
  };
  
  return (
    <AuthModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Giriş"
    >
      {error && (
        <div style={{
          backgroundColor: '#7f1d1d',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <p style={{ color: '#fca5a5', margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="email" style={{
            display: 'block',
            color: '#94a3b8',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            E-posta
          </label>
          <input 
            id="email"
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px'
            }}
            placeholder="ornek@email.com"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="password" style={{
            display: 'block',
            color: '#94a3b8',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Şifre
          </label>
          <input 
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px'
            }}
            placeholder="••••••••"
          />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            <input 
              type="checkbox" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Beni hatırla
          </label>
          <a 
            href="#" 
            style={{
              fontSize: '14px',
              color: '#a78bfa',
              textDecoration: 'none'
            }}
          >
            Şifremi unuttum?
          </a>
        </div>

        <button 
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#7c3aed',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>

        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          Hesabınız yok mu?{' '}
          <button 
            type="button"
            onClick={switchToRegister}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#a78bfa',
              fontWeight: '500',
              padding: 0,
              cursor: 'pointer'
            }}
          >
            Kayıt Ol
          </button>
        </div>
      </form>
    </AuthModal>
  );
}

/**
 * Kayıt Olma Modal Bileşeni
 */
export function RegisterModal({ 
  isOpen, 
  onClose,
  onRegisterSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onRegisterSuccess?: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Kayıt sırasında bir hata oluştu');
      }
      
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  const openLoginModal = () => {
    onClose();
    const event = new CustomEvent('openLoginModal');
    window.dispatchEvent(event);
  };
  
  if (!isOpen) return null;
  
  return (
    <AuthModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Yeni Hesap Oluştur"
      description="Kütüphane hizmetlerinden yararlanmak için hesap oluşturun."
    >
      {error && (
        <div style={{
          backgroundColor: '#7f1d1d',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <p style={{ color: '#fca5a5', margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#94a3b8',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Ad Soyad
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ad Soyad"
            required
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#94a3b8',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            E-posta
          </label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@mail.com"
            required
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#94a3b8',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Şifre
          </label>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#94a3b8',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Şifre (Tekrar)
          </label>
          <input 
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••"
            required
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#334155',
              border: '1px solid #475569',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px'
            }}
          />
        </div>
        
        <button 
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#7c3aed',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
        </button>
        
        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          Zaten hesabınız var mı?{' '}
          <button 
            type="button"
            onClick={openLoginModal}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#a78bfa',
              fontWeight: '500',
              padding: 0,
              cursor: 'pointer'
            }}
          >
            Giriş Yap
          </button>
        </div>
      </form>
    </AuthModal>
  );
} 