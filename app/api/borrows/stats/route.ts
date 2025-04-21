import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * GET - Ödünç alma istatistiklerini getir
 * 
 * @route GET /api/borrows/stats
 * @param {Request} request - HTTP istek nesnesi
 * @returns {Object} 200 - En çok ödünç alınan kitaplar ve en aktif kullanıcılar
 * @returns {Object} 401 - Yetkilendirme hatası
 * @returns {Object} 500 - Sunucu hatası
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
        { error: 'Geçersiz token' },
        { status: 401 }
      );
    }
    
    // Sadece admin kullanıcıları bu endpoint'e erişebilir
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    });
    
    if (!user || user.role.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { error: 'Bu işlem için admin yetkisi gereklidir' },
        { status: 403 }
      );
    }

    // Tüm ödünç kayıtlarını getir
    const borrows = await prisma.borrow.findMany({
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            published: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // En çok ödünç alınan kitapları hesapla
    const bookStats: { [key: string]: { id: string, title: string, author: string, count: number } } = {};
    
    borrows.forEach(borrow => {
      const bookId = borrow.book.id;
      if (!bookStats[bookId]) {
        bookStats[bookId] = {
          id: bookId,
          title: borrow.book.title,
          author: borrow.book.author,
          count: 0
        };
      }
      bookStats[bookId].count += 1;
    });
    
    const topBooks = Object.values(bookStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // En aktif kullanıcıları hesapla
    const userStats: { [key: string]: { id: string, name: string, email: string, count: number } } = {};
    
    borrows.forEach(borrow => {
      const userId = borrow.user.id;
      if (!userStats[userId]) {
        userStats[userId] = {
          id: userId,
          name: borrow.user.name,
          email: borrow.user.email,
          count: 0
        };
      }
      userStats[userId].count += 1;
    });
    
    const topUsers = Object.values(userStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(user => ({
        ...user,
        initial: user.name.charAt(0).toUpperCase()
      }));
    
    // Genel istatistikler
    const totalBorrows = borrows.length;
    const totalActiveLoans = borrows.filter(b => !b.returnDate).length;
    const returnRate = totalBorrows > 0 
      ? Math.round((borrows.filter(b => b.returnDate).length / totalBorrows) * 100) 
      : 0;
    
    // Son 7 gündeki ödünç
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentBorrows = borrows.filter(b => new Date(b.borrowDate) >= sevenDaysAgo).length;
    
    // Son 24 saatteki işlemler (ödünç ve iade)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    // Son 24 saatteki ödünç alma sayısı
    const dailyBorrows = borrows.filter(b => 
      new Date(b.borrowDate) >= twentyFourHoursAgo
    ).length;
    
    // Son 24 saatteki iade sayısı
    const dailyReturns = borrows.filter(b => 
      b.returnDate && new Date(b.returnDate) >= twentyFourHoursAgo
    ).length;
    
    // Toplam günlük işlem sayısı
    const dailyTransactions = dailyBorrows + dailyReturns;
    
    // Ortalama ödünç süresi (iade edilenler için)
    let averageBorrowDays = 0;
    const returnedBorrows = borrows.filter(b => b.returnDate);
    
    if (returnedBorrows.length > 0) {
      const totalDays = returnedBorrows.reduce((total, borrow) => {
        const borrowDate = new Date(borrow.borrowDate);
        const returnDate = new Date(borrow.returnDate as Date);
        const diffTime = Math.abs(returnDate.getTime() - borrowDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return total + diffDays;
      }, 0);
      
      averageBorrowDays = Math.round(totalDays / returnedBorrows.length);
    }
    
    return NextResponse.json({
      topBooks,
      topUsers,
      stats: {
        totalBorrows,
        totalActiveLoans,
        returnRate,
        recentBorrows,
        averageBorrowDays,
        dailyTransactions
      }
    });
  } catch (error) {
    console.error('İstatistik getirme hatası:', error);
    return NextResponse.json(
      { error: 'İstatistikler getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 