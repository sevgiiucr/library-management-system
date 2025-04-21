'use client';

import './globals.css';
import Navbar from './components/Navbar';

/**
 * Kök Layout Bileşeni
 * 
 * Bu bileşen, tüm sayfalar için ortak bir yapı sağlar.
 * HTML, head ve body etiketlerini içerir.
 * Fontları ve temel CSS'i yükler.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <title>Kütüphane Yönetim Sistemi</title>
        <meta name="description" content="Kitapların büyülü dünyasına hoş geldiniz" />
        {/* Google Fonts için gerekli bağlantılar */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <style>{`
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #000;
            color: #fff;
            font-family: 'Poppins', sans-serif;
            overflow-x: hidden;
          }
        `}</style>
      </head>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
