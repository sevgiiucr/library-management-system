import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET /api/categories
export async function GET(request: NextRequest) {
  try {
    // Tüm kategorileri getir
    const categories = await prisma.$queryRaw`
      SELECT id, name, description FROM Category ORDER BY name ASC
    `;

    // Başarılı yanıt döndür
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('Kategorileri getirme hatası:', error);
    return NextResponse.json(
      { error: 'Kategoriler getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 