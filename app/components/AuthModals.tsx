'use client';

import React, { useState, useEffect } from 'react';

// AuthModal bileşeni - önce sildiğimiz bileşeni buraya taşıyoruz
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
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          {title}
        </h2>
        
        {description && (
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            {description}
          </p>
        )}
        
        <div className="mt-4">
          {children}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full inline-flex justify-center text-gray-500 hover:text-gray-600 focus:outline-none"
        >
          Kapat
        </button>
      </div>
    </div>
  );
};

/**
 * Giriş Yapma Modal Bileşeni
 * @param {boolean} isOpen - Modal'ın açık/kapalı durumu
 * @param {function} onClose - Modal'ı kapatma fonksiyonu
 */
export function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Giriş yapılırken bir hata oluştu');
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onClose();
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş yapılırken bir hata oluştu');
    }
  };
  
  const openRegisterModal = () => {
    onClose();
    // Global event yerine doğrudan openRegister fonksiyonunu çağıracağız
    const event = new CustomEvent('openRegisterModal');
    window.dispatchEvent(event);
  };
  
  return (
    <AuthModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Giriş"
      description="Kütüphane hizmetlerinden yararlanmak için giriş yapın.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-200 text-red-500 rounded-md text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-2 text-sm">
            E-posta
          </label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@mail.com"
            required
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-2 text-sm">
            Şifre
          </label>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm"
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" />
            Beni hatırla
          </label>
          <a href="#" className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400">
            Şifremi unuttum
          </a>
        </div>
        <button 
          type="submit"
          className="w-full p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium mt-4 transition duration-150"
        >
          Giriş Yap
        </button>
        <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-300">
          Hesabınız yok mu?{' '}
          <button 
            type="button"
            onClick={openRegisterModal}
            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 font-medium"
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
  onRegisterSuccess: () => void;
}) {
  if (!isOpen) return null;
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
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
      
      onRegisterSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt sırasında bir hata oluştu');
    }
  };
  
  const openLoginModal = () => {
    onClose();
    const event = new CustomEvent('openLoginModal');
    window.dispatchEvent(event);
  };
  
  return (
    <AuthModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Yeni Hesap Oluştur"
      description="Kütüphane hizmetlerini kullanmak için hesap oluşturun.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-200 text-red-500 rounded-md text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-2 text-sm">
            İsim Soyisim
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ahmet Yılmaz"
            required
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-2 text-sm">
            E-posta
          </label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@mail.com"
            required
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-2 text-sm">
            Şifre
          </label>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
            minLength={6}
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-2 text-sm">
            Şifre Tekrar
          </label>
          <input 
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••"
            required
            minLength={6}
            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm"
          />
        </div>
        <button 
          type="submit"
          className="w-full p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium mt-4 transition duration-150"
        >
          Hesap Oluştur
        </button>
        <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-300">
          Zaten hesabınız var mı?{' '}
          <button 
            type="button"
            onClick={openLoginModal}
            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 font-medium"
          >
            Giriş Yap
          </button>
        </div>
      </form>
    </AuthModal>
  );
} 