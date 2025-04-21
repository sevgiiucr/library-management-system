import { NextResponse } from 'next/server';
import { validateImage, compressImage } from '@/app/lib/image-utils';
import { verifyToken } from '@/lib/auth';

/**
 * POST - Kitap görseli yükleme (kitap ID olmadan)
 * 
 * @route POST /api/books/image
 * @param {Request} request - HTTP istek nesnesi
 * 
 * @returns {Object} 200 - Başarılı yanıt
 * @returns {Object} 400 - Geçersiz istek
 * @returns {Object} 401 - Yetkilendirme hatası
 * @returns {Object} 500 - Sunucu hatası
 */
export async function POST(request: Request) {
  try {
    // Token kontrolü (admin kullanıcılar için)
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Yetkilendirme token\'ı gerekli' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Bu işlem için admin yetkisi gereklidir' },
        { status: 401 }
      );
    }

    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Görsel verisi gerekli' },
        { status: 400 }
      );
    }
    
    // Görsel doğrulama
    if (!validateImage(imageUrl)) {
      return NextResponse.json(
        { error: 'Geçersiz görsel formatı veya boyutu (max: 5MB)' },
        { status: 400 }
      );
    }
    
    // Görseli sıkıştır (büyük görseller için)
    let processedImageUrl = imageUrl;
    if (imageUrl.length > 500000) { // ~500KB'dan büyükse sıkıştır
      try {
        processedImageUrl = await compressImage(imageUrl);
      } catch (err) {
        console.error('Görsel sıkıştırma hatası:', err);
        // Sıkıştırma başarısız olsa da devam et
      }
    }
    
    return NextResponse.json({
      message: 'Kitap görseli başarıyla işlendi',
      imageUrl: processedImageUrl
    });
  } catch (error) {
    console.error('Kitap görseli işleme hatası:', error);
    return NextResponse.json(
      { error: 'Kitap görseli işlenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 