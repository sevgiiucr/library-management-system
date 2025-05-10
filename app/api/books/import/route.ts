import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getBookById } from '@/app/lib/openLibrary';
import { verifyToken } from '@/lib/auth';

// POST /api/books/import
// Bir kitabı Open Library'den içe aktarıp veritabanına kaydet
export async function POST(request: NextRequest) {
  try {
    // Kullanıcı doğrulaması
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Yetkilendirme başlığı gerekli' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const tokenData = verifyToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş token' },
        { status: 401 }
      );
    }

    // Yönetici kontrolü (isteğe bağlı, kitap eklemek için yönetici olması gerekmiyorsa kaldırılabilir)
    // if (tokenData.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Bu işlem için yönetici hakları gerekli' },
    //     { status: 403 }
    //   );
    // }

    // İstek gövdesini al
    const { openLibraryId } = await request.json();

    if (!openLibraryId) {
      return NextResponse.json(
        { error: 'Open Library kitap ID\'si gerekli' },
        { status: 400 }
      );
    }

    // Kitabı Open Library'den al
    const bookData = await getBookById(openLibraryId);

    if (!bookData) {
      return NextResponse.json(
        { error: 'Kitap bulunamadı' },
        { status: 404 }
      );
    }

    // Kitabın zaten veritabanında olup olmadığını kontrol et
    const existingBook = await prisma.book.findFirst({
      where: {
        OR: [
          { title: bookData.title, author: bookData.author },
          { externalId: openLibraryId } as any
        ]
      }
    });

    if (existingBook) {
      return NextResponse.json(
        { message: 'Bu kitap zaten kütüphanede mevcut', book: existingBook },
        { status: 200 }
      );
    }

    // Kategorileri veritabanında bul veya oluştur
    const categoryIds = await Promise.all(bookData.categories.map(async (categoryName) => {
      // Kategori adını düzgün formatlama
      const formattedName = categoryName.trim().charAt(0).toUpperCase() + categoryName.trim().slice(1).toLowerCase();
      
      // Kategoriyi bul veya oluştur
      const category = await prisma.category.upsert({
        where: { name: formattedName },
        update: {},
        create: {
          name: formattedName,
          description: `${formattedName} kategorisi`
        }
      });

      return category.id;
    }));

    // Kitabı veritabanına ekle
    const book = await prisma.book.create({
      data: {
        title: bookData.title,
        author: bookData.author,
        published: bookData.published,
        description: bookData.description || '',
        available: true,
        imageUrl: bookData.imageUrl,
        publisher: bookData.publisher || 'Bilinmiyor',
        language: bookData.language || 'Bilinmiyor',
        externalId: openLibraryId,
        isbn: bookData.isbn || null,
        // Kategorileri bağla
        categories: {
          create: categoryIds.map(categoryId => ({
            category: {
              connect: { id: categoryId }
            }
          }))
        },
        // Ekleyen kullanıcıyı kaydet
        addedBy: tokenData.userId
      } as any
    });

    return NextResponse.json(
      { message: 'Kitap başarıyla kütüphaneye eklendi', book },
      { status: 201 }
    );

  } catch (error) {
    console.error('Kitap içe aktarma hatası:', error);
    return NextResponse.json(
      { error: 'Kitap içe aktarılırken bir hata oluştu' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 