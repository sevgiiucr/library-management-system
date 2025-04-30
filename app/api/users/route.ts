// USERS API
// Kullanıcı listesi ve yeni kullanıcı oluşturma işlemleri

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcrypt';

// GET - Tüm kullanıcıları listele (sadece admin)

/**
 * Sistemdeki tüm kullanıcıları listeler
 * Güvenlik için şifre bilgisi gönderilmez
 * 
 * @route GET /api/users
 * @returns {Array} 200 - Kullanıcı listesi
 * @returns {Object} 500 - Sunucu hatası
 * 
 * @example
 * // Başarılı yanıt
 * [
 *   {
 *     "id": "123",
 *     "name": "Kullanıcı Adı",
 *     "email": "user@example.com",
 *     "role": "user"
 *   }
 * ]
 */
export async function GET(request: Request) {
  try {
    console.log('GET /api/users isteği alındı');
    
    // Token kontrolü
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      console.log('Token bulunamadı');
      return NextResponse.json(
        { error: 'Yetkilendirme token\'ı gerekli' },
        { status: 401 }
      );
    }
    
    console.log('Token alındı, doğrulanıyor...');
    
    try {
      const decoded = verifyToken(token);
      if (!decoded || !decoded.userId) {
        console.log('Token geçersiz veya süresi dolmuş');
        return NextResponse.json(
          { error: 'Geçersiz veya süresi dolmuş token' },
          { status: 401 }
        );
      }
      
      console.log('Token doğrulandı, kullanıcı ID:', decoded.userId);

      // Admin yetkisini kontrol et
      const admin = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { role: true }
      });

      console.log('Kullanıcı rolü:', admin?.role);

      if (!admin || admin.role.toLowerCase() !== 'admin') {
        console.log('Kullanıcı admin yetkisine sahip değil');
        return NextResponse.json(
          { error: 'Bu işlem için admin yetkisi gerekli' },
          { status: 403 }
        );
      }

      console.log('Admin yetkisi doğrulandı, kullanıcılar getiriliyor...');

      // Tüm kullanıcıları getir (şifre hariç)
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImageUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              borrows: true,
              favorites: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`${users.length} kullanıcı başarıyla getirildi`);
      
      return NextResponse.json(users);
    } catch (tokenError) {
      console.error('Token doğrulama hatası:', tokenError);
      return NextResponse.json(
        { error: 'Token doğrulama hatası' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Kullanıcıları getirme hatası:', error);
    return NextResponse.json(
      { error: 'Kullanıcılar getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Yeni kullanıcı ekle

/**
 * Sisteme yeni bir kullanıcı ekler
 * 
 * @route POST /api/users
 * @param {Request} request - HTTP istek nesnesi
 * @body {Object} userData - Kullanıcı bilgileri
 * @body {string} userData.name - Kullanıcı adı (zorunlu)
 * @body {string} userData.email - Email adresi (zorunlu)
 * @body {string} userData.password - Şifre (zorunlu)
 * @body {string} userData.role - Kullanıcı rolü (opsiyonel, varsayılan: "user")
 * 
 * @returns {Object} 201 - Oluşturulan kullanıcı bilgileri
 * @returns {Object} 400 - Eksik/hatalı bilgi hatası
 * @returns {Object} 409 - Email çakışması hatası
 * @returns {Object} 500 - Sunucu hatası
 * 
 * @example
 * // İstek body örneği
 * {
 *   "name": "Yeni Kullanıcı",
 *   "email": "user@example.com",
 *   "password": "güvenli-şifre",
 *   "role": "user"
 * }
 */
export async function POST(request: Request) {
  try {
    // İstek gövdesinden kullanıcı bilgilerini al
    const { name, email, password, role = 'user' } = await request.json();

    // Gerekli alanları kontrol et
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Isim, email ve şifre alanları gereklidir' },
        { status: 400 }
      );
    }

    // Email formatını kontrol et
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Geçerli bir email adresi giriniz' },
        { status: 400 }
      );
    }

    // Email adresi daha önce kullanılmış mı kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email adresi zaten kullanılıyor' },
        { status: 409 }
      );
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Yeni kullanıcıyı oluştur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      }
    });

    // Kullanıcı bilgilerini geri döndür (şifre hariç)
    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    return NextResponse.json(
      { error: 'Kullanıcı oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
} 