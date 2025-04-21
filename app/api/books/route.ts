import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Prisma veritabanı bağlantısını başlat
const prisma = new PrismaClient();

// ===================================
// GET - Tüm Kitapları Listeleme Endpoint'i
// ===================================
/**
 * Sistemdeki tüm kitapları ve varsa aktif ödünç alma bilgilerini listeler
 * 
 * @route GET /api/books
 * @param {Request} request - HTTP istek nesnesi
 * 
 * @returns {Array} 200 - Kitap listesi ve ödünç bilgileri
 * @returns {Object} 500 - Sunucu hatası
 * 
 * @example
 * // Başarılı yanıt
 * [
 *   {
 *     "id": "123",
 *     "title": "Kitap Adı",
 *     "author": "Yazar Adı",
 *     "published": 2024,
 *     "available": true,
 *     "currentBorrow": {
 *       "id": "borrow123",
 *       "borrowDate": "2024-03-21T10:00:00Z",
 *       "user": {
 *         "id": "user123",
 *         "name": "Kullanıcı Adı",
 *         "email": "user@example.com"
 *       }
 *     }
 *   }
 * ]
 */
export async function GET() {
  try {
    // Tüm kitapları ve ilişkili ödünç alma kayıtlarını getir
    const books = await prisma.book.findMany({
      include: {
        // Sadece iade edilmemiş ödünç alma kayıtlarını dahil et
        borrows: {
          where: {
            returnDate: null // returnDate null ise kitap hala ödünç verilmiş demektir
          },
          include: {
            // Ödünç alan kullanıcı bilgilerini de getir
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Başarılı yanıt döndür
    return NextResponse.json(books);
  } catch (error) {
    // Hata durumunda loglama yap ve hata yanıtı döndür
    console.error('Kitapları getirme hatası:', error);
    return NextResponse.json(
      { error: 'Kitaplar getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// ===================================
// POST - Yeni Kitap Ekleme Endpoint'i
// ===================================
/**
 * Sisteme yeni bir kitap ekler
 * 
 * @route POST /api/books
 * @param {Request} request - HTTP istek nesnesi
 * @body {Object} bookData - Eklenecek kitap bilgileri
 * @body {string} bookData.title - Kitap başlığı (zorunlu)
 * @body {string} bookData.author - Yazar adı (zorunlu)
 * @body {number} bookData.published - Yayın yılı (zorunlu)
 * @body {string} bookData.imageUrl - Kitap kapak görseli URL'i (opsiyonel)
 * 
 * @returns {Object} 201 - Oluşturulan kitap bilgileri
 * @returns {Object} 400 - Eksik/hatalı bilgi hatası
 * @returns {Object} 500 - Sunucu hatası
 * 
 * @example
 * // İstek body örneği
 * {
 *   "title": "Yeni Kitap",
 *   "author": "Yazar Adı",
 *   "published": 2024,
 *   "imageUrl": "https://example.com/kitap-kapak.jpg"
 * }
 */

// imageUrl kontrolü ve temizleme
const prepareImageUrlForDatabase = (imageUrl: string | null | undefined) => {
  if (!imageUrl || imageUrl === '') {
    console.log('API - Resim URL boş');
    return null;
  }
  
  try {
    console.log('API - Resim URL prefix:', imageUrl.substring(0, 30));
    
    // String çok uzun, SQL Server VARCHAR(max) sınırına yakın mı?
    if (imageUrl.length > 30000) {
      console.warn('API - Resim URL uzunluğu çok fazla:', imageUrl.length);
    }
    
    // Base64 formatını doğrula
    if (!imageUrl.includes(';base64,')) {
      console.warn('API - Base64 prefix eksik, düzeltiliyor');
      imageUrl = 'data:image/jpeg;base64,' + imageUrl;
    }
    
    return imageUrl;
  } catch (error) {
    console.error('API - Resim URL hazırlama hatası:', error);
    return null;
  }
};

export async function POST(request: Request) {
  try {
    // İstek gövdesinden verileri ayıkla
    let requestBody;
    try {
      requestBody = await request.json();
      console.log('API - Alınan ham istek özellikleri:', Object.keys(requestBody));
    } catch (parseError) {
      console.error('API - İstek gövdesi parse edilemedi:', parseError);
      return NextResponse.json(
        { error: 'Geçersiz JSON formatı' },
        { status: 400 }
      );
    }
    
    const { title, author, published, imageUrl } = requestBody;
    
    console.log('API - Alınan kitap verisi:', { 
      title, 
      author, 
      published, 
      imageUrl: imageUrl ? `Uzunluk: ${imageUrl.length}, İlk 30 karakter: ${imageUrl.substring(0, 30)}...` : null 
    });
    
    // Gerekli alanların kontrolü
    if (!title || !author || !published) {
      console.error('API - Eksik veri:', { title: !!title, author: !!author, published: !!published });
      return NextResponse.json(
        { error: 'Kitap başlığı, yazar ve yayın yılı gereklidir' },
        { status: 400 }
      );
    }
    
    // Yayın yılını sayıya dönüştür
    const publishedYear = parseInt(published, 10);
    
    // Sayı kontrolü
    if (isNaN(publishedYear)) {
      console.error('API - Geçersiz yayın yılı:', published);
      return NextResponse.json(
        { error: 'Yayın yılı geçerli bir sayı olmalıdır' },
        { status: 400 }
      );
    }
    
    // imageUrl kontrolü
    const imageUrlValue = prepareImageUrlForDatabase(imageUrl);
    console.log('API - İşlenecek imageUrl değeri:', imageUrlValue ? `Base64 string (Uzunluk: ${imageUrlValue.length})` : 'Null');
    
    try {
      // Yeni kitabı veritabanına ekle
      const newBook = await prisma.book.create({
        data: {
          title,
          author,
          published: publishedYear,
          available: true, // Kitap eklendikten sonra varsayılan olarak müsait olacak
          imageUrl: imageUrlValue, // imageUrl yoksa null olarak ayarla
        },
      });
      
      console.log('API - Oluşturulan kitap:', { 
        id: newBook.id, 
        title: newBook.title, 
        imageUrlExists: !!newBook.imageUrl,
        imageUrlLength: newBook.imageUrl ? newBook.imageUrl.length : 0
      });
      
      // Başarılı yanıt döndür
      return NextResponse.json(newBook, { status: 201 });
    } catch (dbError: any) {
      console.error('API - Veritabanı hatası:', {
        name: dbError.name,
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta
      });
      
      // SQL Server hatası
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Bu kitap zaten mevcut' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: `Veritabanı hatası: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    // Hata durumunda loglama yap ve hata yanıtı döndür
    console.error('API - Genel kitap ekleme hatası:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { error: `Kitap eklenirken bir hata oluştu: ${error.message}` },
      { status: 500 }
    );
  }
}


