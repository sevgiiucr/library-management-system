'use client';

import React, { useState } from 'react';
import Link from 'next/link';

/**
 * Kitap bilgilerini tanımlayan TypeScript interface
 * API'den gelen kitap verilerinin tipini belirler
 * @property id - Kitabın benzersiz tanımlayıcısı
 * @property title - Kitabın başlığı
 * @property author - Kitabın yazarı
 * @property published - Kitabın yayın yılı
 * @property available - Kitabın müsait olup olmadığı
 * @property currentBorrow - Eğer kitap ödünç alındıysa ilgili ödünç alma bilgileri
 */
interface BookProps {
  id: string;
  title: string;
  author: string;
  published: number;
  available?: boolean;
  currentBorrow?: {
    borrowDate: string;
    user: {
      name: string;
    }
  } | null;
}

/**
 * Kitap Kartı Bileşeni
 * 
 * Her bir kitap için bilgileri kart şeklinde görüntüler
 * Kitabın durumunu (müsait/ödünç alındı) görsel olarak gösterir
 * Kitap detay sayfasına link içerir
 * Hover durumunda animasyon efekti vardır
 * 
 * @param {BookProps} props - Kitap bilgilerini içeren özellikler
 * @returns {JSX.Element} - Render edilen kitap kartı
 */
export default function BookCard({ id, title, author, published, available = true, currentBorrow }: BookProps) {
  // Kitabın durum metnini belirle (Müsait / Ödünç Alındı)
  const statusText = available ? 'Müsait' : 'Ödünç Alındı';

  return (
    // Kitap detay sayfasına link
    <Link href={`/books/${id}`} className="no-underline">
      {/* Ana kitap kartı container'ı */}
      <div 
        className="w-full max-w-[350px] bg-slate-800/80 rounded-lg p-4 shadow-md
                  border border-white/10 overflow-hidden mb-5 cursor-pointer
                  backdrop-blur-sm transition-all duration-300
                  hover:transform hover:-translate-y-1 hover:shadow-lg"
      >
        {/* Kitap başlığı */}
        <h3 className="text-xl font-bold text-white mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
          {title}
        </h3>
        
        {/* Kitap yazarı */}
        <p className="text-sm text-gray-400 mb-1">{author}</p>
        
        {/* Yayın yılı */}
        <p className="text-xs text-gray-500 mb-3">Yayın Yılı: {published}</p>
        
        {/* Eğer kitap ödünç alınmışsa, kim tarafından alındığı bilgisi */}
        {currentBorrow && !available && (
          <div className="text-xs text-gray-300 mt-2">
            <span>{new Date(currentBorrow.borrowDate).toLocaleDateString('tr-TR')}</span> 
            <span> tarihinde </span>
            <span className="italic">{currentBorrow.user.name}</span>
            <span> tarafından ödünç alındı</span>
          </div>
        )}
        
        {/* Durum etiketi ve detay butonu satırı */}
        <div className="flex justify-between items-center mt-3">
          {/* Kitabın durum etiketi (Müsait/Ödünç Alındı) */}
          <span className={`px-2 py-1 rounded text-xs font-bold
                           ${available 
                             ? 'bg-green-500/20 text-green-500' 
                             : 'bg-red-500/20 text-red-500'
                           }`}>
            {statusText}
          </span>
          
          {/* Detaylar butonu */}
          <button 
            className="px-3 py-1.5 bg-white/10 text-white rounded text-xs 
                      transition-colors duration-200 hover:bg-amber-300/30"
          >
            Detaylar
          </button>
        </div>
      </div>
    </Link>
  );
} 