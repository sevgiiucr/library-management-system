import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyToken } from '@/lib/auth';

// PUT - Kitap iade işlemi
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Ödünç alma ID gerekli' },
        { status: 400 }
      );
    }

    // Ödünç alma kaydını bul
    const borrow = await prisma.borrow.findUnique({
      where: { id },
      include: { book: true }
    });

    if (!borrow) {
      return NextResponse.json(
        { error: 'Ödünç alma kaydı bulunamadı' },
        { status: 404 }
      );
    }

    // Kullanıcı kendi kitabını iade edebilir veya admin her kitabı iade edebilir
    if (borrow.userId !== decoded.userId) {
      // Kullanıcının admin olup olmadığını kontrol et
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { role: true }
      });

      if (!user || user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Bu kitabı iade etme yetkiniz yok' },
          { status: 403 }
        );
      }
    }

    // Kitap zaten iade edilmiş mi kontrol et
    if (borrow.returnDate) {
      return NextResponse.json(
        { error: 'Bu kitap zaten iade edilmiş' },
        { status: 400 }
      );
    }

    // Transaction başlat (Kitap durumu güncelleme ve iade tarihini güncelleme)
    const updatedBorrow = await prisma.$transaction(async (tx) => {
      // Ödünç alma kaydını güncelle
      const updatedBorrow = await tx.borrow.update({
        where: { id },
        data: {
          returnDate: new Date()
        },
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
              author: true
            }
          }
        }
      });

      // Kitabın durumunu müsait olarak güncelle
      await tx.book.update({
        where: { id: borrow.bookId },
        data: { available: true }
      });

      return updatedBorrow;
    });

    return NextResponse.json({ 
      message: 'Kitap başarıyla iade edildi',
      borrow: updatedBorrow
    });
  } catch (error) {
    console.error('Kitap iade hatası:', error);
    return NextResponse.json(
      { error: 'Kitap iade edilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 