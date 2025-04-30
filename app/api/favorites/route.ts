import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - Kullanıcının favori kitaplarını listele
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

    // Kullanıcının favori kitaplarını getir
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: decoded.userId
      },
      include: {
        book: true
      }
    });

    // Kitap bilgilerini formatla
    const favoriteBooks = favorites.map((fav: any) => ({
      id: fav.id,
      bookId: fav.book.id,
      title: fav.book.title,
      author: fav.book.author,
      published: fav.book.published,
      available: fav.book.available,
      imageUrl: fav.book.imageUrl
    }));

    console.log('Döndürülen favori kitaplar:', favoriteBooks);
    return NextResponse.json(favoriteBooks);
  } catch (error) {
    console.error('Favori kitapları getirme hatası:', error);
    return NextResponse.json(
      { error: 'Favori kitaplar getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Kitabı favorilere ekle
export async function POST(request: Request) {
  try {
    console.log('Favori ekleme POST isteği alındı');
    
    // Token kontrolü
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header:', authHeader);
    
    const token = authHeader?.split(' ')[1];
    if (!token) {
      console.log('Token bulunamadı');
      return NextResponse.json(
        { error: 'Yetkilendirme token\'ı gerekli' },
        { status: 401 }
      );
    }

    console.log('Token doğrulanıyor');
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      console.log('Token geçersiz veya süresi dolmuş');
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş token' },
        { status: 401 }
      );
    }

    console.log('Token doğrulandı, kullanıcı ID:', decoded.userId);
    
    // İstek gövdesinden kitap ID'sini al
    const requestBody = await request.json();
    const { bookId } = requestBody;
    console.log('İstek gövdesi:', requestBody);
    
    if (!bookId) {
      console.log('Kitap ID eksik');
      return NextResponse.json(
        { error: 'Kitap ID gerekli' },
        { status: 400 }
      );
    }

    // Kitabın var olup olmadığını kontrol et
    console.log('Kitap varlığı kontrol ediliyor, ID:', bookId);
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    });

    if (!book) {
      console.log('Kitap bulunamadı');
      return NextResponse.json(
        { error: 'Kitap bulunamadı' },
        { status: 404 }
      );
    }
    console.log('Kitap bulundu:', book.title);

    // Kitap zaten favorilerde mi kontrol et
    console.log('Favori zaten var mı kontrol ediliyor');
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_bookId: {
          userId: decoded.userId,
          bookId: bookId
        }
      }
    });

    if (existingFavorite) {
      console.log('Kitap zaten favorilerde');
      return NextResponse.json(
        { error: 'Bu kitap zaten favorilerinizde', id: existingFavorite.id },
        { status: 409 }
      );
    }

    // Favorilere ekle
    console.log('Kitap favorilere ekleniyor');
    const favorite = await prisma.favorite.create({
      data: {
        userId: decoded.userId,
        bookId: bookId
      }
    });
    console.log('Favori oluşturuldu:', favorite);

    return NextResponse.json({ 
      message: 'Kitap favorilere eklendi',
      id: favorite.id
    }, { status: 201 });
  } catch (error) {
    console.error('Favori ekleme hatası:', error);
    return NextResponse.json(
      { error: 'Favori eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 