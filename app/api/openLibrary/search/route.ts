import { NextRequest, NextResponse } from 'next/server';
import { searchBooks } from '@/app/lib/openLibrary';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = Number(searchParams.get('limit') || 100);
    
    if (!query) {
      return NextResponse.json(
        { error: 'Arama sorgusu gereklidir' },
        { status: 400 }
      );
    }
    
    const books = await searchBooks(query, limit);
    
    return NextResponse.json(books, { status: 200 });
  } catch (error) {
    console.error('Arama hatası:', error);
    return NextResponse.json(
      { error: 'Kitaplar aranırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 