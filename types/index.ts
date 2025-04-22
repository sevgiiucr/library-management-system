// API yanıtları için genel tip
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Kitap modeli
export interface Book {
  id: string;
  title: string;
  author: string;
  published: number;
  available: boolean;
  imageUrl?: string;
  cover_image?: string;
  isFavorite?: boolean;
  favoriteId?: string;
  categories: Array<{
    categoryId: string;
    category?: {
      id: string;
      name: string;
      description?: string;
    }
  }>;
}

// Kategori modeli
export interface Category {
  id: string;
  name: string;
  description?: string;
}

// Kullanıcı modeli
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  profileImage?: string;
}

// Ödünç alma modeli
export interface Borrow {
  id: string;
  userId: string;
  bookId: string;
  borrowDate: string;
  returnDate: string | null;
  user?: User;
  book?: Book;
}

// Favori modeli
export interface Favorite {
  id: string;
  userId: string;
  bookId: string;
  createdAt: string;
  book?: Book;
}

// Bildirim tipi
export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info' | null;
} 