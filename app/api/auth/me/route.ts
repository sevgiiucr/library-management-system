import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * GET - Mevcut kullanıcının bilgilerini getirme
 * 
 * @route GET /api/auth/me
 * @param {Request} request - HTTP istek nesnesi
 * @returns {Object} 200 - Kullanıcı bilgileri
 * @returns {Object} 401 - Yetkilendirme hatası
 * @returns {Object} 404 - Kullanıcı bulunamadı
 * @returns {Object} 500 - Sunucu hatası
 */
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
        { error: 'Geçersiz token' },
        { status: 401 }
      );
    }

    console.log('API - Kullanıcı bilgisi isteniyor, ID:', decoded.userId);

    // Kullanıcıyı ID ile bul
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        profileImageUrl: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      console.log('API - Kullanıcı bulunamadı, ID:', decoded.userId);
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    console.log('API - Kullanıcı bilgileri:', {
      id: user.id,
      name: user.name,
      email: user.email,
      profileImageExists: !!user.profileImageUrl,
      createdAt: user.createdAt
    });

    return NextResponse.json({
      message: 'Kullanıcı bilgileri başarıyla getirildi',
      user: user
    });
  } catch (error) {
    console.error('Kullanıcı bilgisi getirme hatası:', error);
    return NextResponse.json(
      { error: 'Kullanıcı bilgileri getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 