import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { Borrow, Book } from '@prisma/client';

export async function GET(request: Request) {
  try {
    // Token'ı doğrula
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      console.log('API hatası: Token eksik');
      return NextResponse.json(
        { error: 'Yetkilendirme token\'ı gerekli' },
        { status: 401 }
      );
    }

    // Token içindeki kullanıcı bilgilerini çıkar
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      console.log('API hatası: Token geçersiz');
      return NextResponse.json(
        { error: 'Geçersiz token' },
        { status: 401 }
      );
    }

    console.log(`API: ${decoded.userId} kullanıcısı için aktif ödünç kitaplar getiriliyor`);

    // Kullanıcının aktif ödünç aldığı kitapları getir
    const borrows = await prisma.borrow.findMany({
      where: {
        userId: decoded.userId,
        returnDate: null // Henüz iade edilmemiş kitaplar
      },
      include: {
        book: true // Kitap detaylarını da getir
      },
      orderBy: {
        borrowDate: 'desc' // En son ödünç alınanı başta göster
      }
    });

    console.log(`Kullanıcı ${decoded.userId} için ${borrows.length} aktif ödünç bulundu`);

    // Borrows boş mu kontrol et
    if (borrows.length === 0) {
      console.log('Kullanıcının aktif ödünç aldığı kitap bulunmuyor');
      return NextResponse.json([]);
    }

    // Yanıt formatını düzenle - Frontend'in beklediği yapıya uygun olmalı
    try {
      const formattedBorrows = borrows.map((borrow: Borrow & { book: Book }) => ({
        id: borrow.id,
        title: borrow.book.title,
        author: borrow.book.author,
        published: borrow.book.published || 2024,
        borrowDate: borrow.borrowDate.toISOString(),
        returnDate: borrow.returnDate ? borrow.returnDate.toISOString() : null,
        bookId: borrow.book.id
      }));

      // API yanıtını kontrol için log
      console.log('API yanıtı:', formattedBorrows.length ? 'Veri var' : 'Veri boş', 
        formattedBorrows.length > 0 ? JSON.stringify(formattedBorrows[0]) : '[]');

      console.log('Toplam ödünç sayısı:', formattedBorrows.length);
      return NextResponse.json(formattedBorrows);
    } catch (err) {
      console.error('Yanıt formatlanırken hata oluştu:', err);
      // Hata durumunda daha basit bir yanıt dön
      const simpleResponse = borrows.map((borrow: any) => ({
        id: borrow.id,
        title: borrow.book.title,
        author: borrow.book.author,
        borrowDate: borrow.borrowDate.toISOString()
      }));
      return NextResponse.json(simpleResponse);
    }
  } catch (error) {
    console.error('Ödünç alınan kitaplar getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Kitaplar getirilirken bir hata oluştu: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 