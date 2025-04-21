import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { validateImage, compressImage } from '@/app/lib/image-utils';
import { verifyToken } from '@/lib/auth';

/**
 * PUT - Kitap kapak görseli yükleme
 * 
 * @route PUT /api/books/{id}/image
 * @param {Request} request - HTTP istek nesnesi
 * @param {Object} params - URL parametreleri
 * @param {string} params.id - Kitap ID'si
 * 
 * @returns {Object} 200 - Başarılı yanıt
 * @returns {Object} 400 - Geçersiz istek
 * @returns {Object} 401 - Yetkilendirme hatası
 * @returns {Object} 404 - Kitap bulunamadı
 * @returns {Object} 500 - Sunucu hatası
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const id = params.id;
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
    
    // Kitabı kontrol et
    const book = await prisma.book.findUnique({
      where: { id }
    });
    
    if (!book) {
      return NextResponse.json(
        { error: 'Kitap bulunamadı' },
        { status: 404 }
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
    
    // Kitap görselini güncelle
    const updatedBook = await prisma.book.update({
      where: { id },
      data: { imageUrl: processedImageUrl },
      select: {
        id: true,
        title: true,
        author: true,
        imageUrl: true
      }
    });
    
    return NextResponse.json({
      message: 'Kitap görseli başarıyla güncellendi',
      book: updatedBook
    });
  } catch (error) {
    console.error('Kitap görseli güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Kitap görseli güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 