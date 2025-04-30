// ===================================
// BORROWS API - TEKİL ÖDÜNÇ İŞLEMLERİ
// ===================================

import { NextResponse } from 'next/server';  // HTTP yanıtları için Next.js kütüphanesi
import prisma from '@/app/lib/prisma';  // Veritabanı işlemleri için Prisma ORM

// ===================================
// GET - Tekil Ödünç Kaydı Getirme
// ===================================
/**
 * Belirli bir ödünç alma kaydını ID'ye göre getirir
 * İlişkili kullanıcı ve kitap bilgilerini de içerir
 * 
 * @route GET /api/borrows/{id}
 * @param {Request} request - HTTP istek nesnesi
 * @param {Object} params - URL parametreleri
 * @param {string} params.id - Getirilecek ödünç kaydının ID'si
 * 
 * @returns {Object} 200 - Ödünç kaydı bilgileri
 * @returns {Object} 404 - Kayıt bulunamadı hatası
 * @returns {Object} 500 - Sunucu hatası
 * 
 * @example
 * // Başarılı yanıt
 * {
 *   "id": "123",
 *   "userId": "user1",
 *   "bookId": "book1",
 *   "borrowDate": "2024-03-21T10:00:00Z",
 *   "returnDate": null,
 *   "user": {
 *     "name": "Kullanıcı Adı",
 *     "email": "user@example.com"
 *   },
 *   "book": {
 *     "title": "Kitap Adı",
 *     "author": "Yazar Adı"
 *   }
 * }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ID'ye göre ödünç kaydını bul
    const borrow = await prisma.borrow.findUnique({
      where: {
        id: params.id,  // URL'den gelen ID parametresi
      },
      include: {
        user: {
          select: {
            name: true,    // Kullanıcı adı
            email: true,   // Email adresi
          }
        },
        book: {
          select: {
            title: true,   // Kitap adı
            author: true,  // Yazar adı
          }
        }
      }
    });

    // Kayıt bulunamadıysa 404 hatası döndür
    if (!borrow) {
      return NextResponse.json(
        { error: 'Ödünç kaydı bulunamadı' },
        { status: 404 }  // Not Found
      );
    }

    // Bulunan kaydı döndür
    return NextResponse.json(borrow);

  } catch (error) {
    // Veritabanı hatası durumunda 500 hatası döndür
    console.error('Ödünç kaydı getirme hatası:', error);
    return NextResponse.json(
      { error: 'Ödünç kaydı getirilirken bir hata oluştu' },
      { status: 500 }  // Internal Server Error
    );
  }
}

// ===================================
// PUT - Kitap İade İşlemi
// ===================================
/**
 * Ödünç alınan bir kitabın iade işlemini gerçekleştirir
 * İade tarihini kaydeder ve kitabı tekrar müsait duruma getirir
 * 
 * @route PUT /api/borrows/{id}
 * @param {Request} request - HTTP istek nesnesi
 * @param {Object} params - URL parametreleri
 * @param {string} params.id - İade edilecek ödünç kaydının ID'si
 * 
 * @returns {Object} 200 - Güncellenmiş ödünç kaydı
 * @returns {Object} 400 - Kitap zaten iade edilmiş
 * @returns {Object} 404 - Kayıt bulunamadı hatası
 * @returns {Object} 500 - Sunucu hatası
 * 
 * @example
 * // Başarılı yanıt
 * {
 *   "id": "123",
 *   "userId": "user1",
 *   "bookId": "book1",
 *   "borrowDate": "2024-03-21T10:00:00Z",
 *   "returnDate": "2024-03-28T15:30:00Z"
 * }
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Ödünç kaydını kontrol et
    const borrow = await prisma.borrow.findUnique({
      where: {
        id: params.id,  // URL'den gelen ID parametresi
      }
    });

    // Kayıt bulunamadıysa hata döndür
    if (!borrow) {
      return NextResponse.json(
        { error: 'Ödünç kaydı bulunamadı' },
        { status: 404 }  // Not Found
      );
    }

    // Kitap zaten iade edildiyse hata döndür
    if (borrow.returnDate) {
      return NextResponse.json(
        { error: 'Bu kitap zaten iade edilmiş' },
        { status: 400 }  // Bad Request
      );
    }

    // Transaction başlat (İade tarihi güncelleme ve kitap durumu güncelleme)
    const [updatedBorrow] = await prisma.$transaction([
      // İade tarihini güncelle
      prisma.borrow.update({
        where: {
          id: params.id,
        },
        data: {
          returnDate: new Date(),  // İade tarihi
        }
      }),
      // Kitabı tekrar müsait yap
      prisma.book.update({
        where: {
          id: borrow.bookId,
        },
        data: {
          available: true,  // Kitap artık müsait
        }
      })
    ]);

    // Güncellenmiş ödünç kaydını döndür
    return NextResponse.json(updatedBorrow);

  } catch (error) {
    // Veritabanı hatası durumunda 500 hatası döndür
    console.error('Kitap iade hatası:', error);
    return NextResponse.json(
      { error: 'Kitap iade işlemi sırasında bir hata oluştu' },
      { status: 500 }  // Internal Server Error
    );
  }
} 