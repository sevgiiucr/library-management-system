import { NextRequest, NextResponse } from 'next/server';
import { getBookById } from '@/app/lib/openLibrary';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Kitap ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    const book = await getBookById(id);
    
    if (!book) {
      return NextResponse.json(
        { error: 'Kitap bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(book, { status: 200 });
  } catch (error) {
    console.error('Kitap detayı getirme hatası:', error);
    return NextResponse.json(
      { error: 'Kitap detayları getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 