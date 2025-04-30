import { NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/auth';

/**
 * POST - Access token yenileme
 * @route POST /api/auth/refresh-token
 * @returns {Object} Yeni access token veya hata mesajı
 */
export async function POST(request: Request) {
  try {
    // Cookie'den refresh token'ı al
    const cookieHeader = request.headers.get('cookie');
    const cookies = cookieHeader?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>) || {};

    const refreshToken = cookies['refreshToken'];

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Yenileme token\'ı bulunamadı' },
        { status: 401 }
      );
    }

    // Refresh token kullanarak yeni bir access token al
    const result = await refreshAccessToken(refreshToken);

    if (!result) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş yenileme token\'ı' },
        { status: 401 }
      );
    }

    // Yeni access token'ı döndür
    return NextResponse.json({
      message: 'Token yenilendi',
      accessToken: result.accessToken
    });
  } catch (error) {
    console.error('Token yenilenirken hata:', error);
    return NextResponse.json(
      { error: 'Token yenilenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 