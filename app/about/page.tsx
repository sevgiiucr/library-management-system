'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function About() {
  return (
    <div className="about-container">
      {/* Arka Plan Görseli */}
      <div className="about-background">
        <Image
          src="/library1.jpg"
          alt="Kütüphane Görünümü"
          fill
          style={{ objectFit: 'cover', opacity: 0.15 }}
          priority
          quality={90}
        />
      </div>
      
      <div className="about-main">
        {/* BAŞLIK */}
        <header className="about-header">
          <h1 className="about-title">
            Kütüphanemiz Hakkında
          </h1>
          <p className="about-description">
            Bilgi ve keşif yolculuğunuzda size rehberlik etmekten mutluluk duyuyoruz.
          </p>
        </header>
        
        {/* MİSYON VE VİZYON */}
        <section className="about-section">
          <div className="about-grid">
            <div className="about-card">
              <h2 className="about-card-title">Misyonumuz</h2>
              <p className="about-card-text">
                Toplumumuza kaliteli ve güncel bilgi kaynakları sunarak, öğrenme ve gelişimi desteklemek. Her yaştan okuyucuya ulaşarak, bilgiye erişimi kolaylaştırmak ve okuma alışkanlığını teşvik etmek.
              </p>
            </div>
            
            <div className="about-card">
              <h2 className="about-card-title">Vizyonumuz</h2>
              <p className="about-card-text">
                Modern teknoloji ile geleneksel kütüphanecilik anlayışını birleştirerek, kullanıcı dostu ve yenilikçi bir öğrenme merkezi olmak. Dijital ve fiziksel kaynakları bir arada sunarak, bilgiye erişimde öncü olmak.
              </p>
            </div>
          </div>
        </section>
        
        {/* KÜTÜPHANEMİZDEN GÖRÜNÜMLER */}
        <section className="about-section">
          <h2 className="about-stats-title">
            Aynanın üzerinde senin için bir not mu var yoksa?
          </h2>
          <div className="about-image-showcase" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div className="about-image-container" style={{ height: '300px' }}>
              <Image
                src="/library2.jpg"
                alt="Kütüphane İç Görünümü"
                width={700}
                height={300}
                className="about-image"
              />
              <div className="about-image-overlay" >
               <center><span>Aynalar sır kapısıysa,<br /> kitaplar onun haritasıdır...</span></center>
              </div>
            </div>
          </div>
        </section>
        
        {/* İSTATİSTİKLER */}
        <section className="about-section">
          <h2 className="about-stats-title">
            Rakamlarla Kütüphanemiz
          </h2>
          <div className="about-stats-grid">
            <div className="about-stat-card">
              <div className="about-stat-number">10,000+</div>
              <div className="about-stat-label">Kitap</div>
            </div>
            <div className="about-stat-card">
              <div className="about-stat-number">1,000+</div>
              <div className="about-stat-label">Üye</div>
            </div>
            <div className="about-stat-card">
              <div className="about-stat-number">500+</div>
              <div className="about-stat-label">Günlük Ziyaretçi</div>
            </div>
            <div className="about-stat-card">
              <div className="about-stat-number">50+</div>
              <div className="about-stat-label">Kategori</div>
            </div>
          </div>
        </section>
        
        {/* İLETİŞİM BİLGİLERİ */}
        <section className="about-section">
          <h2 className="about-contact-title">
            İletişim Bilgilerimiz
          </h2>
          <div className="about-contact-card">
            <div className="about-contact-grid">
              <div>
                <h3 className="about-contact-item-title">Adres</h3>
                <p className="about-contact-item-text">Kütüphane Caddesi, No: 42<br />Ankara, Türkiye</p>
              </div>
              <div>
                <h3 className="about-contact-item-title">Telefon</h3>
                <p className="about-contact-item-text">(0312) 456 78 90</p>
                <p className="about-contact-item-text" style={{fontSize: '0.875rem'}}>Pazartesi - Cumartesi: 9:00 - 20:00</p>
              </div>
              <div>
                <h3 className="about-contact-item-title">E-posta</h3>
                <p className="about-contact-item-text">info@kutuphanemiz.org</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* ANA SAYFAYA GERİ DÖN */}
        <div style={{textAlign: 'center'}}>
          <Link 
            href="/" 
            className="about-button"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
} 