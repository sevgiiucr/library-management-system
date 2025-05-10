export interface Book {
  id: string;
  title: string;
  author: string;
  published: number;
  available: boolean;
  imageUrl?: string;
  isFavorite?: boolean;
  favoriteId?: string;
  categories: string[];
  description?: string;
  language?: string;
  publisher?: string;
  isbn?: string | null;
  externalId?: string; // Open Library ID
  currentBorrow?: {
    id: string;
    userId: string;
    borrowDate: string;
    user: {
      id: string;
      name: string;
      email: string;
    }
  } | null;
}

export interface OpenLibraryBook {
  id?: string; // Opsiyonel, BookDetailClient'da gerekli
  title: string;
  author: string;
  published: number | null; // null değeri de kabul edilecek
  imageUrl?: string;
  description?: string;
  available?: boolean;
  isFavorite?: boolean;
  favoriteId?: string;
}

export interface BookDetailClientProps {
  book: Book | OpenLibraryBook;
  bookId?: string; // OpenLibrary ID
  source?: 'local' | 'openLibrary';
}

export interface FavoriteStatus {
  isFavorite: boolean;
  favoriteId?: string;
} 