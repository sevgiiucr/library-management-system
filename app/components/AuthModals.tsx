'use client';

import React, { useState, useEffect } from 'react';

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
    } else {
      // Modal kapanırken, animasyon için 300ms bekle
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      
      // Component unmount olduğunda zamanlayıcıyı temizle
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Modal görünür değilse hiçbir şey render etme
  if (!isVisible) return null;

  return (
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
          {title}
        </h2>
        
        {/* Açıklama varsa göster */}
        {description && (
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            {description}
          </p>
        )}
        
        <div className="mt-4">
          {children}
        </div>

        {/* Kapatma butonu */}
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
    
    try {
      // API'ye giriş isteği gönder
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      // Başarısız yanıt gelirse hata fırlat
      if (!response.ok) {
        throw new Error(data.error || 'Giriş yapılırken bir hata oluştu');
      }
      
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
  };
  
  return (
    <AuthModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Giriş"
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
        {/* Şifre alanı */}
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
        {/* Beni hatırla ve Şifremi unuttum */}
        <div className="flex justify-between items-center mt-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" />
            Beni hatırla
          </label>
          <a href="#" className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400">
            Şifremi unuttum
          </a>
        </div>
        {/* Giriş butonu */}
        <button 
          type="submit"
          className="w-full p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium mt-4 transition duration-150"
        >
          Giriş Yap
        </button>
        {/* Kayıt olma yönlendirmesi */}
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
 * 
 * Yeni kullanıcı kaydı formunu içeren modal bileşenidir.
 * İsim, email, şifre ve şifre tekrar alanlarını içerir.
 * 
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
  // Form alanları için state'ler (Hook kuralları gereği koşuldan önce tanımlanmalı)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(''); // Hata mesajı için state
  
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
    setError(''); // Önceki hatayı temizle
    
    // Şifre eşleşmesini kontrol et
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
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
      
      // Başarılı kayıt: Callback çağır ve modalı kapat
      onRegisterSuccess();
      onClose();
    } catch (err) {
      // Hata durumunda kullanıcıya göster
      setError(err instanceof Error ? err.message : 'Kayıt sırasında bir hata oluştu');
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
  
  return (
    <AuthModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Yeni Hesap Oluştur"
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
        {/* Email alanı */}
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
        {/* Şifre alanı */}
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
        {/* Şifre tekrarı alanı */}
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
        {/* Kayıt ol butonu */}
        <button 
          type="submit"
          className="w-full p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium mt-4 transition duration-150"
        >
          Hesap Oluştur
        </button>
        {/* Giriş yapma yönlendirmesi */}
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