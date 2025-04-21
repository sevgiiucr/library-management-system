import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Kategorileri oluştur
  const categories = [
    { name: 'Kurgu', description: 'Roman, hikaye ve diğer kurgu eserler' },
    { name: 'Bilim ve Eğitim', description: 'Bilimsel ve eğitici kitaplar' },
    { name: 'Klasikler', description: 'Klasik edebi eserler' },
    { name: 'Polisiye', description: 'Suç ve dedektif hikayeleri' },
    { name: 'Biyografi', description: 'Gerçek yaşam hikayeleri' },
    { name: 'Tarih', description: 'Tarihi olaylar ve dönemler hakkında kitaplar' }
  ];

  console.log('Kategoriler oluşturuluyor...');
  
  // Mevcut kategorileri temizle
  await prisma.$executeRaw`DELETE FROM [BookCategory]`;
  await prisma.$executeRaw`DELETE FROM [Category]`;
  
  // Yeni kategorileri ekle
  for (const category of categories) {
    await prisma.$executeRaw`
      INSERT INTO [Category] (id, name, description) 
      VALUES (${randomUUID()}, ${category.name}, ${category.description})
    `;
  }

  console.log('Kategoriler başarıyla oluşturuldu!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Hata:', e);
    await prisma.$disconnect();
    process.exit(1);
  }); 