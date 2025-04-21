import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// GET /api/books/[id]/categories - Belirli bir kitabın kategorilerini getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = params.id;

    // Kitabın var olup olmadığını kontrol et
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json(
        { error: "Kitap bulunamadı" },
        { status: 404 }
      );
    }

    // Kitabın kategorilerini raw SQL sorgusu ile getir
    const bookCategories = await prisma.$queryRaw`
      SELECT bc.categoryId, c.name 
      FROM BookCategory bc
      JOIN Category c ON bc.categoryId = c.id
      WHERE bc.bookId = ${bookId}
    `;

    return NextResponse.json(bookCategories, { status: 200 });
  } catch (error) {
    console.error("Kitap kategorileri getirme hatası:", error);
    return NextResponse.json(
      { error: "Kitap kategorileri getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 