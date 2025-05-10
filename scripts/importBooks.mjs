// Import Books Script (ESM)
// Bu script Open Library'den popüler kitapları çeker ve veritabanına kaydeder

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

// Open Library API URL'leri
const SEARCH_API_URL = 'https://openlibrary.org/search.json';
const COVERS_API_URL = 'https://covers.openlibrary.org/b/id/';

async function searchBooks(query, limit = 100) {
  try {
    const response = await fetch(`${SEARCH_API_URL}?q=${encodeURIComponent(query)}&limit=${limit}&page=1&mode=everything`);
    
    if (!response.ok) {
      throw new Error(`Kitaplar alınamadı: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`Open Library Arama API sonuçları: ${data.docs?.length || 0} kitap bulundu`);
    
    // API sonuçlarını Book arayüzüne uyarla
    const books = data.docs.slice(0, limit).map((book) => ({
      title: book.title || 'Başlıksız Kitap',
      author: book.author_name?.[0] || 'Bilinmeyen Yazar',
      published: book.first_publish_year || 2000,
      available: true,
      imageUrl: book.cover_i ? `${COVERS_API_URL}${book.cover_i}-M.jpg` : null,
      description: book.description || null,
      language: book.language?.[0] || 'en',
      publisher: book.publisher?.[0] || null,
      isbn: book.isbn?.[0] || null,
      externalId: book.key?.replace('/works/', '') || book.key,
      addedBy: 'system',
      // Extract categories from subjects or add default categories
      categories: book.subject ? 
        book.subject.slice(0, 3).map(s => s.toLowerCase()) : 
        ['fiction']
    }));
    
    return books;
  } catch (error) {
    console.error('Kitap arama hatası:', error);
    return [];
  }
}

async function getPopularBooks(limit = 100) {
  return searchBooks('subject:fiction', limit);
}

async function importBooksToDatabase() {
  try {
    console.log('Open Library kitapları getiriliyor...');
    const books = await getPopularBooks(100);
    console.log(`${books.length} kitap bulundu.`);
    
    if (books.length === 0) {
      console.log('Hiç kitap bulunamadı.');
      return;
    }
    
    console.log('Mevcut kitaplar kontrol ediliyor...');
    // Zaten veritabanında olan kitapları kontrol et (externalId'ye göre)
    const existingBooks = await prisma.book.findMany({
      where: {
        externalId: {
          in: books.map(book => book.externalId).filter(Boolean)
        }
      },
      select: {
        externalId: true
      }
    });
    
    const existingIds = existingBooks.map(book => book.externalId);
    console.log(`${existingIds.length} kitap zaten veritabanında mevcut.`);
    
    // Yeni kitapları filtreleme
    const newBooks = books.filter(book => book.externalId && !existingIds.includes(book.externalId));
    console.log(`${newBooks.length} yeni kitap eklenecek.`);
    
    if (newBooks.length === 0) {
      console.log('Eklenecek yeni kitap yok.');
      return;
    }
    
    console.log('Kitaplar veritabanına ekleniyor...');
    
    // Her 10 kitabı bir batch olarak ekle (aşırı yüklemeden kaçınmak için)
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < newBooks.length; i += batchSize) {
      batches.push(newBooks.slice(i, i + batchSize));
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Batch ${i+1}/${batches.length} işleniyor... (${batch.length} kitap)`);
      
      const results = await Promise.allSettled(
        batch.map(async (book) => {
          try {
            // Book objesinden categories field'ını çıkar
            // çünkü Prisma şemasında doğrudan bu field yok
            const { categories, ...bookData } = book;
            
            return await prisma.book.create({
              data: bookData
            });
          } catch (err) {
            console.error(`Kitap eklenirken hata: ${book.title}`, err);
            throw err;
          }
        })
      );
      
      const batchSuccess = results.filter(r => r.status === 'fulfilled').length;
      const batchFail = results.filter(r => r.status === 'rejected').length;
      
      successCount += batchSuccess;
      failCount += batchFail;
      
      console.log(`Batch ${i+1} tamamlandı: ${batchSuccess} başarılı, ${batchFail} başarısız`);
    }
    
    console.log(`İşlem tamamlandı. ${successCount} kitap başarıyla eklendi, ${failCount} kitap eklenemedi.`);
    
  } catch (error) {
    console.error('Kitaplar import edilirken hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Script'i çalıştır
importBooksToDatabase()
  .then(() => console.log('Import işlemi tamamlandı.'))
  .catch(err => {
    console.error('Import işlemi başarısız oldu:', err);
    process.exit(1);
  }); 