'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Bu sayfa, eski OpenLibrary yoluna gelen istekleri Tüm Kitaplar sayfasına yönlendirmek için kullanılır.
 * Eski bağlantılar ve yer imleri için geçiş çözümü olarak eklenmiştir.
 */
export default function RedirectToBooks() {
  const router = useRouter();
  
  useEffect(() => {
    // Open Library yolundan Books sayfasına yönlendir
    router.replace('/books?source=openLibrary');
  }, [router]);
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#1a202c'
    }}>
      <p style={{ color: 'white' }}>Open Library sayfasına yönlendiriliyorsunuz...</p>
    </div>
  );
} 