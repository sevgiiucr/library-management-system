import { Suspense } from "react";
import BookDetailClient from "../../components/BookDetailClient";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from 'next';
import { OpenLibraryBook } from "@/app/interfaces/book";
import Image from 'next/image';
import Navbar from '../../components/Navbar';

// Dinamik metadata
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params;
  const book = await getOpenLibraryBook(id);
  
  if (!book) {
    return {
      title: 'Kitap Bulunamadı',
      description: 'Aradığınız kitap bulunamadı.'
    };
  }
  
  return {
    title: `${book.title} | Kütüphane`,
    description: book.description?.substring(0, 160) || `${book.title} - ${book.author}`,
    openGraph: {
      images: [book.imageUrl || '/book-placeholder.jpg'],
    },
  };
}

async function getOpenLibraryBook(id: string): Promise<OpenLibraryBook | null> {
  try {
    const response = await fetch(`https://openlibrary.org/works/${id}.json`);
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Yazar bilgisini al
    let author = "Bilinmiyor";
    if (data.authors && data.authors.length > 0) {
      const authorKey = data.authors[0].author.key;
      const authorResponse = await fetch(`https://openlibrary.org${authorKey}.json`);
      if (authorResponse.ok) {
        const authorData = await authorResponse.json();
        author = authorData.name || "Bilinmiyor";
      }
    }
    
    // Kitap kapağı için
    let imageUrl;
    if (data.covers && data.covers.length > 0) {
      imageUrl = `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`;
    }
    
    // Açıklama için
    let description = "";
    if (data.description) {
      description = typeof data.description === "object" 
        ? data.description.value 
        : data.description;
    }
    
    // OpenLibraryBook tipine uygun olarak dönüştür
    const book: OpenLibraryBook = {
      id: id, // OpenLibrary ID'sini ekledik
      title: data.title || "Başlıksız",
      author,
      published: data.first_publish_date ? parseInt(data.first_publish_date) : null,
      description,
      imageUrl,
      available: true // OpenLibrary kitapları genellikle müsait olarak varsayılır
    };
    
    return book;
    
  } catch (error) {
    console.error("OpenLibrary API hatası:", error);
    return null;
  }
}

export default async function OpenLibraryBookDetail({ params }: { params: { id: string } }) {
  const book = await getOpenLibraryBook(params.id);
  
  if (!book) {
    notFound();
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Link href="/openLibrary" className="text-blue-500 hover:underline">
          &larr; Open Library Kitaplarına Dön
        </Link>
      </div>
      
      <Suspense fallback={<div>Kitap bilgileri yükleniyor...</div>}>
        <BookDetailClient 
          book={book} 
          bookId={params.id}
          source="openLibrary" 
        />
      </Suspense>
    </div>
  );
} 