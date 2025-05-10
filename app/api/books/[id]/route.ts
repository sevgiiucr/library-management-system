import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// Interface tanımı - tip kontrolü için kullanıldığı için tutuyoruz
interface BookData {
  id: string;
  title: string;
  author: string;
  published: number;
  available: boolean;
  imageUrl?: string | null;
  categories?: { categoryId: string }[];
}

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
    const { id } = params;
    
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
    const { id } = params;
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
    const updateData: Record<string, any> = {
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
    const { id } = params;
    
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
    // Burada params nesnesinden id'yi doğrudan çıkarmak yerine, 
    // await ile beklememiz gerekiyor
    const id = params.id;
    console.log("API PATCH: Kitap id:", id);

    // İstek gövdesini al
    const requestBody = await request.json();
    const { action, userId } = requestBody;
    
    console.log("API PATCH: İşlem:", action, "Kullanıcı id:", userId);
    
    if (!action || !userId) {
      return NextResponse.json(
        { error: 'İşlem (action) ve kullanıcı ID (userId) gereklidir' },
        { status: 400 }
      );
    }
    
    // Kitabı veritabanından bul
    console.log("API PATCH: Kitap veritabanından aranıyor");
    const book = await prisma.book.findUnique({
      where: { id }
    });
    
    if (!book) {
      console.log("API PATCH: Kitap bulunamadı");
      return NextResponse.json(
        { error: 'Kitap bulunamadı' },
        { status: 404 }
      );
    }
    
    // Kullanıcıyı kontrol et
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      console.log("API PATCH: Kullanıcı bulunamadı");
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }
    
    console.log("API PATCH: Kullanıcı bulundu:", userId, user.name.charAt(0));
    
    if (action === 'borrow') {
      // Kitap zaten ödünç alınmışsa hata ver
      if (book.available === false) {
        console.log("API PATCH: Kitap zaten ödünç alınmış");
        return NextResponse.json(
          { error: 'Bu kitap zaten ödünç alınmış' },
          { status: 400 }
        );
      }
      
      // Kullanıcı kitabı ödünç almak istiyor, kitabı ve borrow tablosunu güncelle
      console.log("API PATCH: Ödünç alma kaydı oluşturuluyor");
      // Önce borrows tablosuna yeni kayıt ekle
      const borrow = await prisma.borrow.create({
        data: {
          userId,
          bookId: id,
          borrowDate: new Date(),
          returnDate: null
        }
      });
      
      console.log("API PATCH: Borrow kaydı oluşturuldu:", borrow);
      
      // Sonra kitabın available durumunu false yap
      console.log("API PATCH: Kitap durumu güncelleniyor");
      const updatedBook = await prisma.book.update({
        where: { id },
        data: { available: false }
      });
      
      console.log("API PATCH: Kitap güncellendi:", updatedBook);
      
      // Başarılı yanıt döndür
      return NextResponse.json(
        { message: 'Kitap başarıyla ödünç alındı', book: updatedBook },
        { status: 200 }
      );
    } 
    else if (action === 'return') {
      // Kitap zaten müsaitse hata ver
      if (book.available === true) {
        console.log("API PATCH: Kitap zaten müsait");
        return NextResponse.json(
          { error: 'Bu kitap zaten iade edilmiş durumda' },
          { status: 400 }
        );
      }
      
      // Kullanıcının en son bu kitabı ödünç aldığı kaydı bul
      console.log("API PATCH: Aktif ödünç alma kaydı aranıyor");
      const borrow = await prisma.borrow.findFirst({
        where: {
          bookId: id,
          userId,
          returnDate: null
        },
        orderBy: {
          borrowDate: 'desc'
        }
      });
      
      if (!borrow) {
        console.log("API PATCH: Bu kitap için aktif ödünç alma kaydı bulunamadı");
        return NextResponse.json(
          { error: 'Bu kitap için ödünç alma kaydı bulunamadı' },
          { status: 404 }
        );
      }
      
      // Ödünç alma kaydını güncelle (iade tarihi ekle)
      console.log("API PATCH: Ödünç alma kaydı güncelleniyor, ID:", borrow.id);
      const updatedBorrow = await prisma.borrow.update({
        where: { id: borrow.id },
        data: { returnDate: new Date() }
      });
      
      console.log("API PATCH: Ödünç alma kaydı güncellendi:", updatedBorrow);
      
      // Kitabın durumunu available yap
      console.log("API PATCH: Kitap durumu güncelleniyor");
      const updatedBook = await prisma.book.update({
        where: { id },
        data: { available: true }
      });
      
      console.log("API PATCH: Kitap güncellendi:", updatedBook);
      
      // Başarılı yanıt döndür
      return NextResponse.json(
        { message: 'Kitap başarıyla iade edildi', book: updatedBook },
        { status: 200 }
      );
    } 
    else {
      console.log("API PATCH: Geçersiz işlem:", action);
      return NextResponse.json(
        { error: 'Geçersiz işlem. Action "borrow" veya "return" olmalıdır' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Kitap işlemi hatası:', error);
    return NextResponse.json(
      { error: 'Kitap işlemi sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}