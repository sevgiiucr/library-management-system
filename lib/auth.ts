import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import prisma from '@/app/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-key';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    return null;
  }
}

// Yeni access token oluşturma fonksiyonu
export function generateAccessToken(userId: string, email: string, role: string): string {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '1h' } // Access token için kısa bir süre (1 saat)
  );
}

// Refresh token oluşturma fonksiyonu
export function generateRefreshToken(userId: string): string {
  const refreshToken = randomBytes(40).toString('hex');
  return refreshToken;
}

// Refresh token ile yeni access token alma
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string } | null> {
  try {
    // Refresh token'ı veritabanında ara
    const user = await prisma.user.findFirst({
      where: {
        refreshToken: refreshToken
      }
    });

    if (!user) {
      return null;
    }

    // Yeni access token oluştur
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    
    return { accessToken };
  } catch (error) {
    console.error('Refresh token hatası:', error);
    return null;
  }
}

// Kullanıcı için refresh token kaydetme
export async function saveRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        refreshToken: refreshToken
      }
    });
    return true;
  } catch (error) {
    console.error('Refresh token kaydetme hatası:', error);
    return false;
  }
}

// Refresh token'ı silme (logout durumunda)
export async function removeRefreshToken(userId: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        refreshToken: null
      }
    });
    return true;
  } catch (error) {
    console.error('Refresh token silme hatası:', error);
    return false;
  }
} 