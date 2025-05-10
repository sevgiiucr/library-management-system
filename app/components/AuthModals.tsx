'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

<<<<<<< HEAD
// Temel AuthModal bileşeni
=======
/**
 * AuthModals.tsx
 * 
 * Bu dosya, kullanıcı kimlik doğrulama için gereken modal bileşenlerini içerir.
 * Başlıca şu bileşenleri bulundurur:
 * - AuthModal: Temel modal yapısı (diğer modaller tarafından kullanılır)
 * - LoginModal: Kullanıcı girişi için modal
 * - RegisterModal: Yeni kullanıcı kaydı için modal
 * 
 * Modal'lar açılıp kapanabilir yapıdadır ve animasyon efektleri içerir.
 */

// AuthModal bileşeni - önce sildiğimiz bileşeni buraya taşıyoruz
/**
 * AuthModal bileşeni için gerekli props tanımı
 * @interface AuthModalProps
 * @property {boolean} isOpen - Modal'ın açık veya kapalı olma durumu
 * @property {Function} onClose - Modal kapatıldığında çağrılacak fonksiyon
 * @property {string} title - Modal başlığı
 * @property {string} [description] - İsteğe bağlı modal açıklaması
 * @property {React.ReactNode} children - Modal içeriği
 */
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * Temel Modal bileşeni - Tüm authentication modallar için temel yapı sağlar
 * 
 * Bu bileşen, giriş ve kayıt modalları tarafından ortak tasarım ve davranış için kullanılır.
 * Modal açılırken ve kapanırken animasyon efekti için isVisible state'i kullanır.
 *
 * @param {boolean} isOpen - Modal'ın görünürlüğünü kontrol eder
 * @param {Function} onClose - Modal kapatılırken çağrılacak fonksiyon
 * @param {string} title - Modal başlığı
 * @param {string} [description] - Modal için açıklama metni (opsiyonel)
 * @param {React.ReactNode} children - Modal içinde gösterilecek içerik
 */
const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children 
}) => {
  // Modal'ın görünür olup olmadığını takip eden state
  const [isVisible, setIsVisible] = useState(false);

  // isOpen prop'u değiştiğinde çalışan effect
  // Modal açılırken hemen gösterilir, kapanırken animasyon için gecikme uygulanır
  useEffect(() => {
    if (isOpen) {
      // Modal açılırken hemen görünür yap
      setIsVisible(true);
      document.body.style.overflow = 'hidden'; 
    } else {
      // Modal kapanırken, animasyon için 300ms bekle
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      document.body.style.overflow = 'auto';
      
      // Component unmount olduğunda zamanlayıcıyı temizle
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Modal görünür değilse hiçbir şey render etme
  if (!isVisible) return null;

  return (
<<<<<<< HEAD
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
=======
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* Modal içeriği - Dışı tıklandığında kapanmaması için event'i durdurur */}
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
          {title}
        </h2>
        
        {/* Açıklama varsa göster */}
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

        {/* Kapatma butonu */}
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
<<<<<<< HEAD
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
=======
 * 
 * Kullanıcı giriş formunu içeren modal bileşenidir.
 * Email ve şifre alanlarını içerir, giriş işlemini gerçekleştirir.
 * 
 * @param {boolean} isOpen - Modal'ın açık/kapalı durumu
 * @param {function} onClose - Modal'ı kapatma fonksiyonu
 */
export function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Form alanları için state'ler (Hook kuralları gereği koşuldan önce tanımlanmalı)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Hata mesajı için state
  
  // Modal kapalıysa hiçbir şey render etme
  if (!isOpen) return null;
  
  /**
   * Form gönderildiğinde çalışan fonksiyon
   * API'ye giriş isteği gönderir ve sonuca göre işlem yapar
   * 
   * @param {React.FormEvent} e - Form submit event'i
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Önceki hatayı temizle
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
    
    try {
      // API'ye giriş isteği gönder
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      
      const data = await response.json();
      
      // Başarısız yanıt gelirse hata fırlat
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Kullanıcı adı veya şifre hatalı');
      }
      
<<<<<<< HEAD
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
=======
      // Başarılı giriş: Token ve kullanıcı bilgilerini kaydet, sayfayı yönlendir
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onClose();
      window.location.href = '/dashboard';
    } catch (err) {
      // Hata durumunda kullanıcıya göster
      setError(err instanceof Error ? err.message : 'Giriş yapılırken bir hata oluştu');
    }
  };
  
  /**
   * Kayıt ol modalını açmak için kullanılan fonksiyon
   * Giriş modalını kapatır ve CustomEvent ile kayıt modalının açılmasını sağlar
   */
  const openRegisterModal = () => {
    onClose(); // Önce mevcut modalı kapat
    // Global event ile kayıt modalını aç (event sistemi ile modaller arası iletişim)
    const event = new CustomEvent('openRegisterModal');
    window.dispatchEvent(event);
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
  };
  
  return (
    <AuthModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Giriş"
<<<<<<< HEAD
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
=======
      description="Kütüphane hizmetlerinden yararlanmak için giriş yapın.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hata mesajı varsa göster */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-200 text-red-500 rounded-md text-sm">
            {error}
          </div>
        )}
        {/* Email alanı */}
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-2 text-sm">
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
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
<<<<<<< HEAD

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="password" style={{
            display: 'block',
            color: '#94a3b8',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
=======
        {/* Şifre alanı */}
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-2 text-sm">
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
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
<<<<<<< HEAD

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
=======
        {/* Beni hatırla ve Şifremi unuttum */}
        <div className="flex justify-between items-center mt-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" />
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
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
<<<<<<< HEAD

=======
        {/* Giriş butonu */}
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
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
<<<<<<< HEAD

        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          color: '#94a3b8',
          fontSize: '14px'
        }}>
=======
        {/* Kayıt olma yönlendirmesi */}
        <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-300">
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
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
<<<<<<< HEAD
=======
 * 
 * Yeni kullanıcı kaydı formunu içeren modal bileşenidir.
 * İsim, email, şifre ve şifre tekrar alanlarını içerir.
 * 
 * @param {boolean} isOpen - Modal'ın açık/kapalı durumu
 * @param {function} onClose - Modal'ı kapatma fonksiyonu
 * @param {function} onRegisterSuccess - Kayıt başarılı olduğunda çağrılacak fonksiyon
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
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
<<<<<<< HEAD
=======
  // Form alanları için state'ler (Hook kuralları gereği koşuldan önce tanımlanmalı)
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
<<<<<<< HEAD
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
=======
  const [error, setError] = useState(''); // Hata mesajı için state
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
  
  // Modal kapalıysa hiçbir şey render etme
  if (!isOpen) return null;
  
  /**
   * Form gönderildiğinde çalışan fonksiyon
   * Şifreleri kontrol eder ve API'ye kayıt isteği gönderir
   * 
   * @param {React.FormEvent} e - Form submit event'i
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
<<<<<<< HEAD
    setError('');
    setLoading(true);
=======
    setError(''); // Önceki hatayı temizle
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
    
    // Şifre eşleşmesini kontrol et
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }
    
    try {
      // API'ye kayıt isteği gönder
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      // Başarısız yanıt gelirse hata fırlat
      if (!response.ok) {
        throw new Error(data.error || 'Kayıt sırasında bir hata oluştu');
      }
      
<<<<<<< HEAD
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
=======
      // Başarılı kayıt: Callback çağır ve modalı kapat
      onRegisterSuccess();
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
      onClose();
    } catch (err) {
      // Hata durumunda kullanıcıya göster
      setError(err instanceof Error ? err.message : 'Kayıt sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Giriş modalını açmak için kullanılan fonksiyon
   * Kayıt modalını kapatır ve CustomEvent ile giriş modalının açılmasını sağlar
   */
  const openLoginModal = () => {
    onClose(); // Önce mevcut modalı kapat
    // Global event ile giriş modalını aç (event sistemi ile modaller arası iletişim)
    const event = new CustomEvent('openLoginModal');
    window.dispatchEvent(event);
  };
  
  if (!isOpen) return null;
  
  return (
    <AuthModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Yeni Hesap Oluştur"
<<<<<<< HEAD
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
=======
      description="Kütüphane hizmetlerini kullanmak için hesap oluşturun.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hata mesajı varsa göster */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-200 text-red-500 rounded-md text-sm">
            {error}
          </div>
        )}
        {/* İsim alanı */}
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-2 text-sm">
            İsim Soyisim
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
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
<<<<<<< HEAD
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#94a3b8',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
=======
        {/* Email alanı */}
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-2 text-sm">
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
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
<<<<<<< HEAD
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#94a3b8',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
=======
        {/* Şifre alanı */}
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-2 text-sm">
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
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
<<<<<<< HEAD
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#94a3b8',
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            Şifre (Tekrar)
=======
        {/* Şifre tekrarı alanı */}
        <div>
          <label className="block text-gray-700 dark:text-gray-200 mb-2 text-sm">
            Şifre Tekrar
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
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
<<<<<<< HEAD
        
=======
        {/* Kayıt ol butonu */}
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
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
<<<<<<< HEAD
        
        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          color: '#94a3b8',
          fontSize: '14px'
        }}>
=======
        {/* Giriş yapma yönlendirmesi */}
        <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-300">
>>>>>>> 7c5837e63bb275c41b3ad26848ac85d97a35a782
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