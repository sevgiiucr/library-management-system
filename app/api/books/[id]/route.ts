import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// Geçici veritabanı referansı (app/api/books/route.ts'den gelecek)
// Bu mock API'da aynı veri yapısını kullanabilmek için global değişkenleri referans olarak alıyoruz
// Gerçek uygulamada bu bir veritabanı olacaktır
let books: any[] = [];

// books array'ini başka bir modülden import etmediğimiz için
// bu route dosyası yüklendiğinde, ana API modülündeki books array'ini almak için hack kullanıyoruz
// Bu, development amaçlı bir çözümdür
const getBooksRef = async () => {
  if (books.length === 0) {
    try {
      // API'yi çağırarak mevcut kitapları al
      const response = await fetch('http://localhost:3000/api/books');
      if (response.ok) {
        const data = await response.json();
        // books dizisini güncelle (referansı değiştirmeden)
        books.splice(0, books.length, ...data);
      }
    } catch (error) {
      console.error('Kitaplar referansı alınamadı:', error);
    }
  }
  return books;
};

// ===================================
// GET - Tekil Kitap Getirme Endpoint'i
// ===================================
/**
 * Belirli bir kitabı ID'ye göre getirir
 * 
 * @route GET /api/books/{id}
 * @param {Request} request - HTTP istek nesnesi
 * @param {Object} params - URL parametreleri
 * @param {string} params.id - Getirilecek kitabın ID'si
 * 
 * @returns {Object} 200 - Kitap bilgileri
 * @returns {Object} 404 - Kitap bulunamadı hatası
 * @returns {Object} 500 - Sunucu hatası
 * 
 * @example
 * // Başarılı yanıt
 * {
 *   "id": "123",
 *   "title": "Kitap Adı",
 *   "author": "Yazar Adı",
 *   "published": 2024,
 *   "available": true
 * }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Kitabı ID'ye göre bul
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
      return NextResponse.json(
        { error: 'Kitap bulunamadı' },
        { status: 404 }
      );
    }
    
    // Boş borrows dizisi kontrolü yaparak currentBorrow bilgisini ekle
    const response = {
      ...book,
      currentBorrow: book.borrows && book.borrows.length > 0 && !book.borrows[0].returnDate 
        ? book.borrows[0] 
        : null
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Kitap getirme hatası:', error);
    return NextResponse.json(
      { error: 'Kitap getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// ===================================
// PUT - Kitap Güncelleme Endpoint'i
// ===================================
/**
 * Belirli bir kitabın bilgilerini günceller
 * 
 * @route PUT /api/books/{id}
 * @param {Request} request - HTTP istek nesnesi
 * @param {Object} params - URL parametreleri
 * @param {string} params.id - Güncellenecek kitabın ID'si
 * @body {Object} updateData - Güncellenecek kitap bilgileri
 * @body {string} updateData.title - Kitap başlığı
 * @body {string} updateData.author - Yazar adı
 * @body {number} updateData.published - Yayın yılı
 * @body {boolean} updateData.available - Müsaitlik durumu
 * @body {string} updateData.imageUrl - Kitap kapak görseli URL'i
 * 
 * @returns {Object} 200 - Güncellenmiş kitap bilgileri
 * @returns {Object} 404 - Kitap bulunamadı hatası
 * @returns {Object} 500 - Sunucu hatası
 * 
 * @example
 * // İstek body örneği
 * {
 *   "title": "Yeni Kitap Adı",
 *   "author": "Yeni Yazar Adı",
 *   "published": 2024,
 *   "available": true,
 *   "imageUrl": "https://example.com/kitap-kapak.jpg"
 * }
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { title, author, published, imageUrl } = await request.json();
    
    console.log('API PUT - Alınan kitap verisi:', { 
      id, 
      title, 
      author, 
      published, 
      imageUrl: imageUrl ? `${imageUrl.substring(0, 30)}...` : null 
    });
    
    // Gerekli alanları kontrol et
    if (!title || !author || !published) {
      return NextResponse.json(
        { error: 'Kitap başlığı, yazar ve yayın yılı gereklidir' },
        { status: 400 }
      );
    }
    
    // Yayın yılını sayıya çevir
    const publishedYear = parseInt(published, 10);
    
    if (isNaN(publishedYear)) {
      return NextResponse.json(
        { error: 'Yayın yılı geçerli bir sayı olmalıdır' },
        { status: 400 }
      );
    }
    
    // Kitabın var olup olmadığını kontrol et
    const existingBook = await prisma.book.findUnique({
      where: { id }
    });
    
    if (!existingBook) {
      return NextResponse.json(
        { error: 'Güncellenecek kitap bulunamadı' },
        { status: 404 }
      );
    }
    
    // imageUrl kontrolü
    const imageUrlValue = imageUrl === undefined ? undefined : (!imageUrl || imageUrl === '' ? null : imageUrl);
    console.log('API PUT - İşlenecek imageUrl değeri:', 
      imageUrlValue === undefined ? 'Değiştirilmeyecek' : 
      imageUrlValue ? 'Yeni değer (base64 string)' : 'Null olarak ayarlanacak');
    
    // Güncelleme verisini hazırla
    const updateData: any = {
      title,
      author,
      published: publishedYear
    };
    
    // imageUrl değiştirilmek isteniyorsa, güncelleme verisine ekle
    if (imageUrlValue !== undefined) {
      updateData.imageUrl = imageUrlValue;
    }
    
    console.log('API PUT - Güncellenecek veriler:', {
      ...updateData,
      imageUrl: updateData.imageUrl ? 'Var (base64 string)' : updateData.imageUrl === null ? 'Null' : 'Değiştirilmeyecek'
    });
    
    // Kitabı güncelle
    const updatedBook = await prisma.book.update({
      where: { id },
      data: updateData
    });
    
    console.log('API PUT - Güncellenen kitap:', { 
      id: updatedBook.id, 
      title: updatedBook.title, 
      imageUrlExists: !!updatedBook.imageUrl 
    });
    
    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error('Kitap güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Kitap güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// ===================================
// DELETE - Kitap Silme Endpoint'i
// ===================================
/**
 * Belirli bir kitabı sistemden siler
 * 
 * @route DELETE /api/books/{id}
 * @param {Request} request - HTTP istek nesnesi
 * @param {Object} params - URL parametreleri
 * @param {string} params.id - Silinecek kitabın ID'si
 * 
 * @returns {Object} 200 - Başarılı silme mesajı
 * @returns {Object} 404 - Kitap bulunamadı hatası
 * @returns {Object} 500 - Sunucu hatası
 * 
 * @example
 * // Başarılı yanıt
 * {
 *   "message": "Kitap başarıyla silindi"
 * }
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Kitabın var olup olmadığını kontrol et
    const existingBook = await prisma.book.findUnique({
      where: { id },
      include: {
        borrows: {
          where: {
            returnDate: null
          }
        }
      }
    });
    
    if (!existingBook) {
      return NextResponse.json(
        { error: 'Silinecek kitap bulunamadı' },
        { status: 404 }
      );
    }
    
    // Kitap şu anda ödünç alınmışsa silme
    if (existingBook.borrows.length > 0) {
      return NextResponse.json(
        { error: 'Ödünç alınmış kitap silinemez' },
        { status: 400 }
      );
    }
    
    // İlişkili ödünç alma kayıtlarını sil
    await prisma.borrow.deleteMany({
      where: { bookId: id }
    });
    
    // Kitabı sil
    await prisma.book.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Kitap başarıyla silindi' });
  } catch (error) {
    console.error('Kitap silme hatası:', error);
    return NextResponse.json(
      { error: 'Kitap silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * PATCH işlevi - Kitap ödünç alma/iade etme
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log("API PATCH: Kitap id:", id);
    
    // İstek gövdesini al
    const requestData = await request.json();
    const { action, userId } = requestData;
    console.log("API PATCH: İşlem:", action, "Kullanıcı id:", userId);
    
    if (!action || (action !== 'borrow' && action !== 'return')) {
      return NextResponse.json(
        { error: 'Geçerli bir işlem belirtilmelidir (borrow veya return)' },
        { status: 400 }
      );
    }
    
    if (action === 'borrow' && !userId) {
      return NextResponse.json(
        { error: 'Kitabı ödünç almak için kullanıcı ID gereklidir' },
        { status: 400 }
      );
    }
    
    // Kitabı bul
    console.log("API PATCH: Kitap veritabanından aranıyor");
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        borrows: {
          where: {
            returnDate: null
          },
          include: {
            user: true
          }
        }
      }
    }).catch(err => {
      console.error("API PATCH: Kitap arama hatası:", err);
      return null;
    });
    
    if (!book) {
      console.log("API PATCH: Kitap bulunamadı");
      return NextResponse.json(
        { error: 'Kitap bulunamadı' },
        { status: 404 }
      );
    }
    
    // Ödünç alma işlemi
    if (action === 'borrow') {
      // Kitap zaten ödünç alınmışsa hata ver
      if (!book.available || book.borrows.length > 0) {
        console.log("API PATCH: Kitap müsait değil");
        return NextResponse.json(
          { error: 'Kitap şu anda müsait değil' },
          { status: 400 }
        );
      }
      
      try {
        console.log("API PATCH: Ödünç alma kaydı oluşturuluyor");
        
        // Kullanıcı kontrolü - Test ortamı için esnek
        let userExists = false;
        try {
          // Kullanıcıyı doğrula
          const user = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          if (user) {
            userExists = true;
            console.log("API PATCH: Kullanıcı bulundu:", user.id, user.name);
          } else {
            // Kullanıcı bulunamadı, test için yeni bir kullanıcı oluştur
            console.log("API PATCH: Kullanıcı bulunamadı, test için yeni kullanıcı oluşturuluyor");
            const newUser = await prisma.user.create({
              data: {
                id: userId,
                name: "Test Kullanıcısı",
                email: "test-" + userId + "@example.com",
                password: "test123" // Gerçek ortamda bu şekilde yapılmamalı!
              }
            });
            userExists = true;
            console.log("API PATCH: Test kullanıcısı oluşturuldu:", newUser.id);
          }
        } catch (userError) {
          console.error("API PATCH: Kullanıcı işlemi hatası:", userError);
          return NextResponse.json(
            { error: 'Kullanıcı doğrulaması sırasında hata: ' + (userError as Error).message },
            { status: 500 }
          );
        }
        
        if (!userExists) {
          return NextResponse.json(
            { error: 'Kullanıcı bulunamadı ve oluşturulamadı' },
            { status: 404 }
          );
        }
        
        // Ödünç alma kaydı oluştur
        const borrowRecord = await prisma.borrow.create({
          data: {
            userId,
            bookId: id
          }
        });
        console.log("API PATCH: Borrow kaydı oluşturuldu:", borrowRecord);
        
        console.log("API PATCH: Kitap durumu güncelleniyor");
        // Kitabın durumunu güncelle
        const updatedBook = await prisma.book.update({
          where: { id },
          data: { available: false }
        });
        console.log("API PATCH: Kitap güncellendi:", updatedBook);
        
        return NextResponse.json({ 
          message: 'Kitap başarıyla ödünç alındı',
          bookId: id,
          available: false,
          borrowId: borrowRecord.id
        });
      } catch (dbError) {
        console.error("API PATCH: Veritabanı işlemi hatası:", dbError);
        return NextResponse.json(
          { error: 'Veritabanı işlemi sırasında hata oluştu: ' + (dbError as Error).message },
          { status: 500 }
        );
      }
    } 
    // İade işlemi
    else if (action === 'return') {
      // Kitap ödünç alınmamışsa hata ver
      if (book.available || book.borrows.length === 0) {
        console.log("API PATCH: Kitap zaten kütüphanede");
        return NextResponse.json(
          { error: 'Bu kitap zaten kütüphanede mevcut' },
          { status: 400 }
        );
      }
      
      try {
        console.log("API PATCH: Ödünç alma kaydı güncelleniyor");
        // Ödünç alma kaydını güncelle
        const borrowRecord = await prisma.borrow.update({
          where: { id: book.borrows[0].id },
          data: { returnDate: new Date() }
        });
        console.log("API PATCH: Borrow kaydı güncellendi:", borrowRecord);
        
        console.log("API PATCH: Kitap durumu güncelleniyor");
        // Kitabın durumunu güncelle
        const updatedBook = await prisma.book.update({
          where: { id },
          data: { available: true }
        });
        console.log("API PATCH: Kitap güncellendi:", updatedBook);
        
        return NextResponse.json({ 
          message: 'Kitap başarıyla iade edildi',
          bookId: id,
          available: true
        });
      } catch (dbError) {
        console.error("API PATCH: Veritabanı işlemi hatası:", dbError);
        return NextResponse.json(
          { error: 'Veritabanı işlemi sırasında hata oluştu: ' + (dbError as Error).message },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Geçersiz işlem' },
      { status: 400 }
    );
  } catch (error) {
    console.error('API PATCH: Genel hata:', error);
    return NextResponse.json(
      { error: 'İşlem sırasında bir hata oluştu: ' + (error as Error).message },
      { status: 500 }
    );
  }
}