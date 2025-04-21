import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * PUT - Kullanıcı profilini güncelleme
 * 
 * @route PUT /api/users/profile
 * @param {Request} request - HTTP istek nesnesi
 * @returns {Object} 200 - Güncellenmiş kullanıcı bilgileri
 * @returns {Object} 401 - Yetkilendirme hatası
 * @returns {Object} 404 - Kullanıcı bulunamadı
 * @returns {Object} 500 - Sunucu hatası
 */
export async function PUT(request: Request) {
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
    if (!decoded) {
      return NextResponse.json(
        { error: 'Geçersiz token' },
        { status: 401 }
      );
    }

    // İstek gövdesinden profil bilgilerini al
    const { profileImageUrl } = await request.json();
    console.log('API - Alınan profil resmi:', profileImageUrl ? `${profileImageUrl.substring(0, 30)}...` : null);

    // Kullanıcıyı ID ile bul
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // profileImageUrl değerini kontrol et
    const profileImageValue = !profileImageUrl || profileImageUrl === '' ? null : profileImageUrl;
    console.log('API - İşlenecek profil resmi değeri:', profileImageValue ? 'Var (base64 string)' : 'Null');

    // Kullanıcı profil bilgilerini güncelle
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        profileImageUrl: profileImageValue
      },
      select: {
        id: true,
        name: true,
        email: true,
        profileImageUrl: true,
        role: true,
        createdAt: true
      }
    });

    console.log('API - Güncellenen kullanıcı:', {
      id: updatedUser.id,
      profileImageExists: !!updatedUser.profileImageUrl
    });

    return NextResponse.json({
      message: 'Profil başarıyla güncellendi',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Profil güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 