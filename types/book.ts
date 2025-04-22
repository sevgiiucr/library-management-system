export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  coverImage?: string;
  status?: string;
  issuedAt?: string;
  returnDate?: string;
  published?: number;
  borrowDate?: string;
  available?: boolean;
  imageUrl?: string;
}
