import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken, saveRefreshToken } from '@/lib/auth';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * POST - Kullanıcı girişi ve token oluşturma
 * @route POST /api/auth/login
 * @param {Object} body - Giriş bilgileri
 * @param {string} body.email - Kullanıcı email adresi
 * @param {string} body.password - Kullanıcı şifresi
 * @returns {Object} Kullanıcı bilgileri ve JWT token veya hata mesajı
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validasyon
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email ve şifre zorunludur' },
        { status: 400 }
      );
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 401 }
      );
    }

    // Şifre kontrolü
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Hatalı şifre' },
        { status: 401 }
      );
    }

    // Access token oluştur (kısa süreli)
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    
    // Refresh token oluştur (uzun süreli)
    const refreshToken = generateRefreshToken(user.id);
    
    // Refresh token'ı veritabanına kaydet
    await saveRefreshToken(user.id, refreshToken);

    // Http-only cookie olarak refresh token'ı ayarla
    const response = NextResponse.json({
      message: 'Giriş başarılı',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken // Artık token yerine accessToken kullanıyoruz
    });

    // Refresh token'ı güvenli bir şekilde http-only cookie olarak ayarla
    // Http-only cookie tarayıcıdan JavaScript ile erişilemez
    response.cookies.set({
      name: 'refreshToken',
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 gün
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Giriş yapılırken hata:', error);
    return NextResponse.json(
      { error: 'Giriş yapılırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 