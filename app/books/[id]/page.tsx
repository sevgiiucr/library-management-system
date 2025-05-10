// Client component yerine Server component kullanıyoruz
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/app/lib/prisma';
import BookDetailClient from '@/app/components/BookDetailClient';

/**
 * Kitap Detay Sayfası
 * Belirli bir kitabın tüm bilgilerini gösterir ve kitabı ödünç alma seçeneği sunar
 */

// getBook fonksiyonu ile kitap verisini alıyoruz
async function getBook(id: string) {
  try {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        borrows: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            borrowDate: 'desc'
          },
          take: 1
        }
      }
    });
    
    if (!book) {
      return null;
    }
    
    // Kitap verilerini client bileşeninin beklediği formata dönüştür
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      published: book.published,
      available: book.available,
      imageUrl: book.imageUrl || undefined,
      currentBorrow: book.borrows && book.borrows.length > 0 && !book.borrows[0].returnDate 
        ? {
            id: book.borrows[0].id,
            userId: book.borrows[0].userId,
            borrowDate: book.borrows[0].borrowDate.toISOString(),
            user: {
              id: book.borrows[0].user.id,
              name: book.borrows[0].user.name,
              email: book.borrows[0].user.email
            }
          }
        : null
    };
  } catch (error) {
    console.error('Kitap getirme hatası:', error);
    throw new Error('Kitap detayları alınırken bir hata oluştu');
  }
}

// Ana sayfa bileşeni (Server Component)
export default async function BookDetailPage({ params }: { params: { id: string } }) {
  // params.id yerine destructuring kullanarak id değerini alıyoruz
  const { id } = params;
  
  // Destructuring yapılan id değerini kullan
  const book = await getBook(id);
  
  // Kitap bulunamazsa 404 sayfasına yönlendir
  if (!book) {
    notFound();
  }
  
  return (
    <div className="book-detail-container" style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Arka Plan Görseli */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
        <Image
          src="/library1.jpg"
          alt="Kütüphane Görünümü"
          fill
          style={{ objectFit: 'cover', opacity: 0.15 }}
          priority
          quality={90}
        />
      </div>
      
      <BookDetailClient book={book} />
    </div>
  );
} 