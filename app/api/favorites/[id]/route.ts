import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyToken } from '@/lib/auth';

// DELETE - Favori kitabı kaldır
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('DELETE isteği alındı, headers:', Object.fromEntries(request.headers));
    console.log('Parametre ID:', params.id);
    
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

    console.log('Token bulundu, doğrulanıyor');
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      console.log('Token geçersiz veya süresi dolmuş');
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş token' },
        { status: 401 }
      );
    }
    
    console.log('Token doğrulandı, kullanıcı ID:', decoded.userId);
    const id = params.id;
    if (!id) {
      console.log('Favori ID eksik');
      return NextResponse.json(
        { error: 'Favori ID gerekli' },
        { status: 400 }
      );
    }

    // Favori kaydını bul
    console.log('Favori aranıyor, ID:', id);
    const favorite = await prisma.favorite.findUnique({
      where: { id }
    });

    console.log('Prisma sorgu sonucu:', favorite);
    if (!favorite) {
      console.log('Favori bulunamadı');
      return NextResponse.json(
        { error: 'Favori bulunamadı' },
        { status: 404 }
      );
    }

    // Kullanıcı yetkisi kontrolü
    console.log('Yetki kontrolü, favori userId:', favorite.userId, 'istek userId:', decoded.userId);
    if (favorite.userId !== decoded.userId) {
      console.log('Kullanıcının yetkisi yok');
      return NextResponse.json(
        { error: 'Bu favoriyi silme yetkiniz yok' },
        { status: 403 }
      );
    }

    // Favoriyi sil
    console.log('Favori siliniyor, ID:', id);
    await prisma.favorite.delete({
      where: { id }
    });

    console.log('Favori başarıyla silindi, ID:', id);
    return NextResponse.json({ 
      message: 'Favori başarıyla silindi'
    });
  } catch (error) {
    console.error('Favori silme hatası:', error);
    return NextResponse.json(
      { error: 'Favori silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 