import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// GET /api/books/[id]/categories - Belirli bir kitabın kategorilerini getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = params.id;
    console.log(`Kitap kategorileri getirme isteği: Kitap ID = ${bookId}`);

    // Kitabın var olup olmadığını kontrol et
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    console.log("Bulunan kitap:", book ? "Kitap bulundu" : "Kitap bulunamadı");

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

    console.log("Kitap kategorileri:", bookCategories);

    return NextResponse.json(bookCategories, { status: 200 });
  } catch (error) {
    console.error("Kitap kategorileri getirme hatası:", error);
    return NextResponse.json(
      { error: "Kitap kategorileri getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 