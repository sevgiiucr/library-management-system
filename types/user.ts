export interface User {
  id: string;
  name: string;
  email: string;
  profileImageUrl?: string;
  createdAt?: string;
  role?: string;
  borrowCount?: number;
} 