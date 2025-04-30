'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// AuthModal bileşeni - ortak modal yapısı
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
      document.body.style.overflow = 'hidden'; // Arka planın kaydırılmasını engelle
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      document.body.style.overflow = 'auto'; // Kaydırmayı tekrar etkinleştir
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md"
      style={{ backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="absolute top-1/2 left-0 right-0 mx-auto bg-black/80 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-6 transform -translate-y-1/2"
        style={{
          animation: 'modalOpen 0.3s ease-out forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-2 text-white text-center">
          {title}
        </h2>
        
        {description && (
          <p className="mb-4 text-gray-300 text-center">
            {description}
          </p>
        )}
        
        <div className="mt-4">
          {children}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full flex justify-center text-gray-400 hover:text-gray-200 transition-colors duration-150"
        >
          Kapat
        </button>
      </div>
    </div>
  );
};

/**
 * Giriş Yapma Modal Bileşeni
 * 
 * Kullanıcı giriş formunu içeren modal bileşenidir.
 * Email ve şifre alanlarını içerir, giriş işlemini gerçekleştirir.
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
      
      // Başarılı giriş - accessToken'ı localStorage'da sakla
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Not: refreshToken otomatik olarak http-only cookie olarak ayarlandı
      // ve JavaScript tarafından erişilemez, bu yüzden burada saklamıyoruz
      
      onClose();
      router.push('/dashboard');
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
      // Alternatif olay tabanlı yaklaşım
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
      description=""
    >
      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-300 p-3 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email input */}
        <div>
          <label htmlFor="email" className="block text-gray-300 mb-2 text-sm">
            E-posta
          </label>
          <input 
            id="email"
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="ornek@email.com"
          />
        </div>

        {/* Password input */}
        <div>
          <label htmlFor="password" className="block text-gray-300 mb-2 text-sm">
            Şifre
          </label>
          <input 
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex justify-between items-center">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input 
              type="checkbox" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            Beni hatırla
          </label>
          <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Şifremi unuttum?
          </a>
        </div>

        {/* Login button */}
        <button 
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium mt-4 transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Giriş yapılıyor...
            </div>
          ) : 'Giriş Yap'}
        </button>

        <div className="text-center mt-4 text-sm text-gray-300">
          Hesabınız yok mu?{' '}
          <button 
            type="button"
            onClick={switchToRegister}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
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
 * @param {boolean} isOpen - Modal'ın açık/kapalı durumu
 * @param {function} onClose - Modal'ı kapatma fonksiyonu
 * @param {function} onRegisterSuccess - Kayıt başarılı olduğunda çağrılacak fonksiyon
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-800 text-red-300 rounded-md text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-gray-300 mb-2 text-sm">
            Ad Soyad
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ad Soyad"
            required
            className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2 text-sm">
            E-posta
          </label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@mail.com"
            required
            className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2 text-sm">
            Şifre
          </label>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
            className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2 text-sm">
            Şifre (Tekrar)
          </label>
          <input 
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••"
            required
            className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button 
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium mt-4 transition-colors duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
        </button>
        <div className="text-center mt-4 text-sm text-gray-300">
          Zaten hesabınız var mı?{' '}
          <button 
            type="button"
            onClick={openLoginModal}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Giriş Yap
          </button>
        </div>
      </form>
    </AuthModal>
  );
} 