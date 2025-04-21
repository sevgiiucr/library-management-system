import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - Kütüphane istatistiklerini getir (sadece admin)
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

    // Admin yetkisini kontrol et
    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    });

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        { error: 'Bu işlem için admin yetkisi gerekli' },
        { status: 403 }
      );
    }

    // İstatistikleri topla

    // 1. Toplam kitap sayısı
    const totalBooks = await prisma.book.count();

    // 2. Müsait kitap sayısı
    const availableBooks = await prisma.book.count({
      where: { available: true }
    });

    // 3. Ödünç alınan kitap sayısı
    const borrowedBooks = await prisma.book.count({
      where: { available: false }
    });

    // 4. Toplam kullanıcı sayısı
    const totalUsers = await prisma.user.count();

    // 5. Toplam ödünç alma sayısı
    const totalBorrows = await prisma.borrow.count();

    // 6. Aktif ödünç alma sayısı
    const activeBorrows = await prisma.borrow.count({
      where: { returnDate: null }
    });

    // 7. En çok ödünç alınan kitaplar
    const mostBorrowedBooks = await prisma.book.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        _count: {
          select: {
            borrows: true
          }
        }
      },
      orderBy: {
        borrows: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // 8. En aktif kullanıcılar
    const mostActiveUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            borrows: true
          }
        }
      },
      orderBy: {
        borrows: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // Sonuçları formatlama
    const stats = {
      totalBooks,
      availableBooks,
      borrowedBooks,
      totalUsers,
      totalBorrows,
      activeBorrows,
      mostBorrowedBooks: mostBorrowedBooks.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        borrowCount: book._count.borrows
      })),
      mostActiveUsers: mostActiveUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        borrowCount: user._count.borrows
      }))
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('İstatistik getirme hatası:', error);
    return NextResponse.json(
      { error: 'İstatistikler alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 