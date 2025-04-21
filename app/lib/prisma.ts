import { PrismaClient } from '@prisma/client';

// Global olarak Prisma Client'ı tanımla
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Geliştirme ortamında birden fazla Prisma Client örneği oluşturmayı önle
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

// Production ortamında olmadığında global nesneye cache'le
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 