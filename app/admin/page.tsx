'use client';

import React, { useState, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Link from 'next/link';

/**
 * Admin Panel Ana Sayfası
 * Yönetim seçeneklerini ve modüllerini listeler
 */

// Admin modüllerini tanımlayan arayüz
interface AdminModule {
  id: string;
  title: string;
  description: string;
  path: string;
}

export default function AdminPage() {
  const router = useRouter();
  
  // Hover edilen modülün indeksini izleyen state
  const [hoveredModuleIndex, setHoveredModuleIndex] = useState<number | null>(null);
  
  // Admin modülleri listesi
  const adminModules: AdminModule[] = [
    {
      id: 'books',
      title: 'Kitap Yönetimi',
      description: 'Kitap ekle, düzenle, sil ve görüntüle',
      path: '/admin/books'
    },
    {
      id: 'users',
      title: 'Kullanıcı Yönetimi',
      description: 'Kullanıcıları görüntüle, düzenle ve yönet',
      path: '/admin/users'
    },
    {
      id: 'borrows',
      title: 'Ödünç İşlemleri',
      description: 'Kitap ödünç alma/iade işlemlerini yönet',
      path: '/admin/borrows'
    },
    {
      id: 'reports',
      title: 'Raporlar',
      description: 'Kütüphane istatistiklerini ve raporlarını görüntüle',
      path: '/admin/reports'
    }
  ];
  
  // Modül kartına tıklama işleyicisi
  const handleModuleClick = (path: string) => {
    router.push(path);
  };
  
  // Container stili
  const containerStyle: CSSProperties = {
    minHeight: '100vh',
    backgroundColor: 'black',
    color: 'white',
    position: 'relative',
  };
  
  // Arkaplan gradient stili
  const backgroundStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle at 30% 50%, rgba(30, 58, 138, 0.15) 0%, rgba(0, 0, 0, 0.95) 100%)',
    zIndex: 1,
  };
  
  // İçerik stili
  const contentStyle: CSSProperties = {
    position: 'relative',
    zIndex: 2,
    padding: '2rem 1rem',
    maxWidth: '1200px',
    margin: '0 auto',
  };
  
  // Başlık stili
  const titleStyle: CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: 'white',
  };
  
  // Alt başlık stili
  const subtitleStyle: CSSProperties = {
    fontSize: '1.25rem',
    marginBottom: '2rem',
    color: '#d1d5db',
  };
  
  // Modül grid stili
  const modulesGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginTop: '2rem',
  };
  
  // Modül kartı stili
  const getModuleCardStyle = (isHovered: boolean): CSSProperties => ({
    backgroundColor: isHovered ? 'rgba(30, 58, 138, 0.3)' : 'rgba(30, 41, 59, 0.8)',
    borderRadius: '12px',
    padding: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
    boxShadow: isHovered 
      ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.2)' 
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: `1px solid ${isHovered ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
    backdropFilter: 'blur(8px)',
  });
  
  // Modül başlık stili
  const moduleTitle: CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: 'white',
  };
  
  // Modül açıklama stili
  const moduleDescription: CSSProperties = {
    fontSize: '0.875rem',
    color: '#9ca3af',
    marginBottom: '1rem',
  };
  
  return (
    <div style={containerStyle}>
      <div style={backgroundStyle} />
      
      {/* Navbar */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Navbar />
      </div>
      
      {/* Admin Menü Bar */}
      <div className="admin-menu-bar">
        <div className="admin-menu-bar-inner">
          <div className="admin-menu-flex">
            <h2 className="admin-menu-title">Admin Panel</h2>
            <div className="admin-menu-links">
              <Link href="/admin" className="admin-menu-link admin-menu-link-active">Dashboard</Link>
              <Link href="/admin/books" className="admin-menu-link">Kitaplar</Link>
              <Link href="/admin/users" className="admin-menu-link">Kullanıcılar</Link>
              <Link href="/admin/borrows" className="admin-menu-link">Ödünç Alma</Link>
              <Link href="/admin/reports" className="admin-menu-link">Raporlar</Link>
            </div>
          </div>
        </div>
      </div>
      
      <div style={contentStyle}>
        <h1 style={titleStyle}>Admin Paneli</h1>
        <p style={subtitleStyle}>
          Kütüphane yönetim sisteminin tüm modüllerine buradan erişebilirsiniz.
        </p>
        
        {/* Modüller Grid */}
        <div style={modulesGridStyle}>
          {adminModules.map((module, index) => (
            <div 
              key={module.id}
              style={getModuleCardStyle(hoveredModuleIndex === index)}
              onClick={() => handleModuleClick(module.path)}
              onMouseEnter={() => setHoveredModuleIndex(index)}
              onMouseLeave={() => setHoveredModuleIndex(null)}
            >
              <h3 style={moduleTitle}>{module.title}</h3>
              <p style={moduleDescription}>{module.description}</p>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
                <button style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}>
                  Yönet
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 