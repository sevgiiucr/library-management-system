import { NextRequest, NextResponse } from 'next/server';
import { getPopularBooks } from '@/app/lib/openLibrary';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get('limit') || 100);
    
    const books = await getPopularBooks(limit);
    
    return NextResponse.json(books, { status: 200 });
  } catch (error) {
    console.error('Popüler kitapları getirme hatası:', error);
    return NextResponse.json(
      { error: 'Popüler kitaplar getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 