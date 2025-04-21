// =================================================================
// USERS API - TEKİL İŞLEMLER
// Kullanıcı görüntüleme, güncelleme ve silme işlemleri
// =================================================================

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET - Belirli bir kullanıcıyı ID'ye göre getir
 * @route GET /api/users/[id]
 * @param {string} id - Kullanıcı ID'si (URL'den alınır)
 * @returns {Object} Kullanıcı bilgileri veya hata mesajı
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Hata:', error);
    return NextResponse.json(
      { error: 'Kullanıcı getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Kullanıcı bilgilerini güncelle
 * @route PUT /api/users/[id]
 * @param {string} id - Güncellenecek kullanıcının ID'si
 * @param {Object} body - Güncellenecek alanlar (name, email, role)
 * @returns {Object} Güncellenmiş kullanıcı bilgileri veya hata mesajı
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Kullanıcı var mı kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // 2. Güncellenecek verileri al
    const body = await request.json();
    const { name, email, role } = body;

    // 3. Email değişiyorsa format kontrolü
    if (email && email !== existingUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Geçerli bir email adresi giriniz' },
          { status: 400 }
        );
      }

      // Email kullanımda mı kontrolü
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Bu email adresi başka bir kullanıcı tarafından kullanılıyor' },
          { status: 409 }
        );
      }
    }

    // 4. Kullanıcıyı güncelle
    const updatedUser = await prisma.user.update({
      where: {
        id: params.id,
      },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Hata:', error);
    return NextResponse.json(
      { error: 'Kullanıcı güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Kullanıcıyı sil
 * @route DELETE /api/users/[id]
 * @param {string} id - Silinecek kullanıcının ID'si
 * @returns {Object} Başarı mesajı veya hata mesajı
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Kullanıcı var mı kontrolü
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // 2. Kullanıcıyı sil
    await prisma.user.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({
      message: 'Kullanıcı başarıyla silindi'
    });
  } catch (error) {
    console.error('Hata:', error);
    return NextResponse.json(
      { error: 'Kullanıcı silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 