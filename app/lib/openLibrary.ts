import { Book } from '@/app/interfaces/book';

// Open Library API URL'leri
const SEARCH_API_URL = 'https://openlibrary.org/search.json';
const BOOK_API_URL = 'https://openlibrary.org/api/books';
const COVERS_API_URL = 'https://covers.openlibrary.org/b/id/';

/**
 * Open Library API'sinden kitapları ara
 * @param query Arama sorgusu
 * @param limit Sonuç limiti
 */
export async function searchBooks(query: string, limit: number = 100): Promise<Book[]> {
  try {
    // Daha fazla sonuç almak için API'ye limit parametresi ve ek parametreler ekleyelim
    const response = await fetch(`${SEARCH_API_URL}?q=${encodeURIComponent(query)}&limit=${limit}&page=1&mode=everything`);
    
    if (!response.ok) {
      throw new Error('Kitaplar alınamadı');
    }
    
    const data = await response.json();
    
    console.log(`Open Library Arama API sonuçları: ${data.docs?.length || 0} kitap bulundu`);
    
    // API sonuçlarını Book arayüzüne uyarla
    const books = data.docs.slice(0, limit).map((book: any) => ({
      id: book.key?.replace('/works/', '') || book.key,
      title: book.title || 'Başlıksız Kitap',
      author: book.author_name?.[0] || 'Bilinmeyen Yazar',
      published: book.first_publish_year || 0,
      available: true, // Varsayılan olarak müsait
      imageUrl: book.cover_i ? `${COVERS_API_URL}${book.cover_i}-M.jpg` : '/book-placeholder.jpg',
      categories: book.subject?.slice(0, 3).map((subject: string) => subject.toLowerCase()) || [],
      description: book.description || 'Bu kitap için açıklama bulunmamaktadır.',
      language: book.language?.[0] || 'Bilinmeyen',
      publisher: book.publisher?.[0] || 'Bilinmeyen Yayınevi',
      isbn: book.isbn?.[0] || null
    }));
    
    console.log(`İşlendikten sonra ${books.length} kitap döndürülüyor`);
    return books;
  } catch (error) {
    console.error('Kitap arama hatası:', error);
    return [];
  }
}

/**
 * ISBN ile kitap detaylarını al
 * @param isbn ISBN numarası
 */
export async function getBookByISBN(isbn: string): Promise<Book | null> {
  try {
    const response = await fetch(`${BOOK_API_URL}?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
    
    if (!response.ok) {
      throw new Error('Kitap detayları alınamadı');
    }
    
    const data = await response.json();
    const bookData = data[`ISBN:${isbn}`];
    
    if (!bookData) return null;
    
    return {
      id: isbn,
      title: bookData.title,
      author: bookData.authors?.[0]?.name || 'Bilinmeyen Yazar',
      published: bookData.publish_date ? parseInt(bookData.publish_date.slice(-4)) : 0,
      available: true,
      imageUrl: bookData.cover?.medium || '/book-placeholder.jpg',
      categories: bookData.subjects?.slice(0, 3).map((subject: any) => subject.name.toLowerCase()) || [],
      description: bookData.notes || bookData.excerpts?.[0]?.text || 'Bu kitap için açıklama bulunmamaktadır.',
      language: bookData.language || 'Bilinmeyen',
      publisher: bookData.publishers?.[0]?.name || 'Bilinmeyen Yayınevi',
      isbn: isbn
    };
  } catch (error) {
    console.error('Kitap detay hatası:', error);
    return null;
  }
}

/**
 * Kitap kimliği ile kitap detaylarını al
 * @param id Kitap kimliği
 */
export async function getBookById(id: string): Promise<Book | null> {
  try {
    const response = await fetch(`https://openlibrary.org/works/${id}.json`);
    
    if (!response.ok) {
      console.error(`OpenLibrary API yanıt hatası: ${response.status}`);
      return null;
    }
    
    const book = await response.json();
    
    // Yazarı almak için ek istek
    let authorName = 'Bilinmeyen Yazar';
    if (book.authors?.[0]?.author) {
      const authorKey = book.authors[0].author.key;
      const authorResponse = await fetch(`https://openlibrary.org${authorKey}.json`);
      if (authorResponse.ok) {
        const authorData = await authorResponse.json();
        authorName = authorData.name || 'Bilinmeyen Yazar';
      }
    }
    
    // Kapak resmini alma
    const coverIdUrl = book.covers?.[0] 
      ? `${COVERS_API_URL}${book.covers[0]}-M.jpg` 
      : '/book-placeholder.jpg';
    
    // Açıklama formatını düzgün işle
    let description = 'Bu kitap için açıklama bulunmamaktadır.';
    if (typeof book.description === 'object' && book.description?.value) {
      description = book.description.value;
    } else if (typeof book.description === 'string') {
      description = book.description;
    }
    
    return {
      id: id,
      title: book.title || 'Başlıksız Kitap',
      author: authorName,
      published: book.first_publish_date ? parseInt(book.first_publish_date.slice(-4), 10) || 0 : 0,
      available: true,
      imageUrl: coverIdUrl,
      categories: book.subjects?.slice(0, 3).map((subject: string) => subject.toLowerCase()) || [],
      description: description,
      language: book.language || 'Bilinmeyen',
      publisher: 'Open Library',
      isbn: null
    };
  } catch (error) {
    console.error('Kitap detay hatası:', error);
    return null;
  }
}

/**
 * Popüler kitapları al
 * @param limit Sonuç limiti
 */
export async function getPopularBooks(limit: number = 100): Promise<Book[]> {
  return searchBooks('subject:fiction', limit);
} 