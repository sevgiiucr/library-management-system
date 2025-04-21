import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/lib/auth';

// ===================================
// GET - Tüm ödünç alma kayıtlarını getir (admin) veya kullanıcının kendi ödünç alma kayıtlarını getir
// ===================================
/**
 * Sistemdeki tüm ödünç alma kayıtlarını listeler
 * İlişkili kullanıcı ve kitap bilgilerini de içerir
 * 
 * @route GET /api/borrows
 * @param {Request} request - HTTP istek nesnesi
 * 
 * @returns {Array} 200 - Ödünç kayıtları listesi
 * @returns {Object} 500 - Sunucu hatası
 * 
 * @example
 * // Başarılı yanıt
 * [
 *   {
 *     "id": "123",
 *     "userId": "user1",
 *     "bookId": "book1",
 *     "borrowDate": "2024-03-21T10:00:00Z",
 *     "returnDate": null,
 *     "user": {
 *       "name": "Kullanıcı Adı",
 *       "email": "user@example.com"
 *     },
 *     "book": {
 *       "title": "Kitap Adı",
 *       "author": "Yazar Adı"
 *     }
 *   }
 * ]
 */
export async function GET(request: Request) {
  try {
    // Token kontrolü
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme token\'ı gerekli' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş token' },
        { status: 401 }
      );
    }

    // Kullanıcı rolünü kontrol et
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Admin tüm kayıtları görebilir, normal kullanıcı sadece kendi kayıtlarını görebilir
    const borrows = await prisma.borrow.findMany({
      where: user.role === 'admin' ? {} : { userId: decoded.userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            imageUrl: true
          }
        }
      },
      orderBy: {
        borrowDate: 'desc'
      }
    });

    return NextResponse.json(borrows);
  } catch (error) {
    console.error('Ödünç alma kayıtları getirme hatası:', error);
    return NextResponse.json(
      { error: 'Ödünç alma kayıtları getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// ===================================
// POST - Yeni ödünç alma kaydı oluştur
// ===================================
/**
 * Yeni bir ödünç alma kaydı oluşturur
 * 
 * @route POST /api/borrows
 * @param {Request} request - HTTP istek nesnesi
 * @body {Object} borrowData - Ödünç alma bilgileri
 * @body {string} borrowData.userId - Ödünç alan kullanıcının ID'si
 * @body {string} borrowData.bookId - Ödünç alınan kitabın ID'si
 * 
 * @returns {Object} 201 - Oluşturulan ödünç kaydı
 * @returns {Object} 400 - Eksik/hatalı bilgi veya kitap müsait değil
 * @returns {Object} 404 - Kullanıcı veya kitap bulunamadı
 * @returns {Object} 500 - Sunucu hatası
 * 
 * @example
 * // İstek body örneği
 * {
 *   "userId": "user123",
 *   "bookId": "book123"
 * }
 */
export async function POST(request: Request) {
  try {
    // Token kontrolü
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme token\'ı gerekli' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş token' },
        { status: 401 }
      );
    }

    // İstek gövdesinden kitap ID'sini al
    const { bookId } = await request.json();
    
    if (!bookId) {
      return NextResponse.json(
        { error: 'Kitap ID gerekli' },
        { status: 400 }
      );
    }

    // Kitabın var olup olmadığını ve müsait olup olmadığını kontrol et
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Kitap bulunamadı' },
        { status: 404 }
      );
    }

    if (!book.available) {
      return NextResponse.json(
        { error: 'Kitap şu anda müsait değil' },
        { status: 400 }
      );
    }

    // Kullanıcının aktif ödünç alma sayısını kontrol et (en fazla 5 kitap)
    const activeBorrows = await prisma.borrow.count({
      where: {
        userId: decoded.userId,
        returnDate: null
      }
    });

    if (activeBorrows >= 5) {
      return NextResponse.json(
        { error: 'En fazla 5 kitap ödünç alabilirsiniz' },
        { status: 400 }
      );
    }

    // Yeni ödünç alma kaydı oluştur ve kitabı müsait değil olarak işaretle
    const borrow = await prisma.$transaction(async (tx) => {
      // Ödünç alma kaydı oluştur
      const newBorrow = await tx.borrow.create({
        data: {
          userId: decoded.userId,
          bookId: bookId,
          borrowDate: new Date()
        }
      });

      // Kitabı müsait değil olarak işaretle
      await tx.book.update({
        where: { id: bookId },
        data: { available: false }
      });

      return newBorrow;
    });

    return NextResponse.json({ 
      message: 'Kitap başarıyla ödünç alındı',
      id: borrow.id
    }, { status: 201 });
  } catch (error) {
    console.error('Kitap ödünç alma hatası:', error);
    return NextResponse.json(
      { error: 'Kitap ödünç alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 