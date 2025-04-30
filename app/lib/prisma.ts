import { PrismaClient } from '@prisma/client';

// PrismaClient singleton örneği
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Geliştirme ortamında her sıcak yeniden yüklemede yeni bağlantı oluşmasını önle
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

export default prisma; 