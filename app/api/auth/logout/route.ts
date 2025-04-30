import { NextResponse } from 'next/server';
import { removeRefreshToken } from '@/lib/auth';

/**
 * POST - Kullanıcı çıkışı
 * @route POST /api/auth/logout
 * @param {Object} body - Kullanıcı bilgileri
 * @param {string} body.userId - Kullanıcı ID'si
 * @returns {Object} Başarı mesajı veya hata
 */
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Kullanıcı ID gerekli' },
        { status: 400 }
      );
    }

    // Refresh token'ı veritabanından kaldır
    await removeRefreshToken(userId);

    // Refresh token cookie'sini temizle
    const response = NextResponse.json({ message: 'Çıkış başarılı' });
    
    response.cookies.set({
      name: 'refreshToken',
      value: '',
      expires: new Date(0), // Geçmişte bir tarih vererek cookie'yi sileriz
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Çıkış yaparken hata:', error);
    return NextResponse.json(
      { error: 'Çıkış yaparken bir hata oluştu' },
      { status: 500 }
    );
  }
} 