import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - Admin yetkisini kontrol et
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
        { error: 'Geçersiz veya süresi dolmuş token' },
        { status: 401 }
      );
    }

    // Kullanıcıyı bul ve admin rolünü kontrol et
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    if (user.role.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { error: 'Bu işlem için admin yetkisi gerekli' },
        { status: 403 }
      );
    }

    return NextResponse.json({ isAdmin: true });
  } catch (error) {
    console.error('Admin yetki kontrolü hatası:', error);
    return NextResponse.json(
      { error: 'Admin yetki kontrolü sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
} 