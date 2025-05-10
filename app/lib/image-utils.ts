/**
 * Görsel İşleme Yardımcı Fonksiyonları
 * Bu dosya, uygulama genelinde kullanılan görsel işleme, doğrulama ve optimizasyon
 * fonksiyonlarını içerir. Kitap kapakları ve kullanıcı profil resimleri gibi 
 * görsellerin işlenmesinde kullanılır.
 */

/**
 * Görsel Doğrulama Fonksiyonu
 * Yüklenen görsellerin boyut ve format açısından uygun olup olmadığını kontrol eder.
 * Bu fonksiyon, kullanıcıların çok büyük veya uyumsuz formatları yüklemesini engeller.
 * 
 * @param {string} base64String - Base64 olarak kodlanmış görsel verisi
 * @param {number} maxSizeInBytes - İzin verilen maksimum dosya boyutu (varsayılan: 5MB)
 * @returns {boolean} - Geçerliyse true, değilse false döner
 */
export function validateImage(base64String: string, maxSizeInBytes: number = 5 * 1024 * 1024): boolean {
  if (!base64String) return false;
  
  // Base64 formatının doğruluğunu kontrol et
  // "data:image/" ile başlamıyorsa geçerli bir görsel formatı değildir
  if (!base64String.startsWith('data:image/')) {
    return false;
  }
  
  // Dosya boyutunu kontrol et
  // Base64 string'leri, ikili verilerine göre yaklaşık %33 daha büyüktür
  // Başlık kısmını çıkararak ve kalan string üzerinden hesaplama yaparak yaklaşık boyutu tahmin edebiliriz
  const base64WithoutHeader = base64String.split(',')[1];
  if (!base64WithoutHeader) return false;
  
  const approximateBytes = Math.ceil((base64WithoutHeader.length * 3) / 4);
  return approximateBytes <= maxSizeInBytes;
}

/**
 * Görsel Sıkıştırma Fonksiyonu
 * Görsellerin kalitesini düşürerek boyutlarını küçültür ve veritabanında 
 * daha az yer kaplamalarını sağlar. Bu fonksiyon, özellikle mobil kullanıcıların
 * bant genişliği kullanımını azaltmak için önemlidir.
 * 
 * @param {string} base64String - Base64 olarak kodlanmış görsel verisi
 * @param {number} quality - Kalite seviyesi (0-1 arası, varsayılan: 0.7)
 * @returns {Promise<string>} - Sıkıştırılmış base64 görsel verisi
 */
export async function compressImage(base64String: string, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!base64String) {
      reject(new Error('Görsel verisi sağlanmadı'));
      return;
    }
    
    // Görseli bir Image nesnesine yükle
    const img = new Image();
    img.onload = () => {
      // Görseli bir canvas üzerine çiz
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context alınamadı'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Belirtilen kalite seviyesinde JPEG formatında sıkıştır
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    img.onerror = () => {
      reject(new Error('Görsel yüklenirken hata oluştu'));
    };
    
    img.src = base64String;
  });
}

/**
 * Görsel Format Çıkarma Fonksiyonu
 * Base64 olarak kodlanmış görsel verisinden format bilgisini (jpeg, png, vb.) çıkarır.
 * Bu bilgi, dosya adı oluşturma ve veritabanında doğru metadata saklama için kullanılır.
 * 
 * @param {string} base64String - Base64 olarak kodlanmış görsel verisi
 * @returns {string} - Görsel formatı (örn. 'jpeg', 'png')
 */
export function getImageFormat(base64String: string): string {
  if (!base64String || !base64String.startsWith('data:image/')) {
    return 'unknown';
  }
  
  // Regular expression ile format bilgisini çıkar
  // Örnek: "data:image/jpeg;base64," -> "jpeg"
  const match = base64String.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
  return match ? match[1] : 'unknown';
}

/**
 * Benzersiz Dosya Adı Oluşturma Fonksiyonu
 * Yüklenen görseller için benzersiz dosya adları oluşturur. Bu, dosya çakışmalarını
 * önler ve her görsel için tekil bir tanımlayıcı sağlar. Zaman damgası ve rastgele
 * karakter dizileri kullanarak benzersizlik garantilenir.
 * 
 * @param {string} prefix - Dosya adı öneki (varsayılan: 'image')
 * @param {string} format - Görsel formatı (örn. 'jpeg', 'png')
 * @returns {string} - Benzersiz dosya adı
 */
export function generateUniqueFilename(prefix: string = 'image', format: string = 'jpeg'): string {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomString}.${format}`;
}

/**
 * Görselin URL'sini doğrular ve geçerli bir URL değilse varsayılan görsel URL'sini döndürür
 * @param url Kontrol edilecek görsel URL'si
 * @returns Doğrulanmış görsel URL'si
 */
export function validateImageUrl(url: string | null | undefined): string {
  // Görsel URL'si boş veya tanımsızsa varsayılan görsel döndür
  if (!url) return '/images/default-book.jpg';
  
  // URL bir veri URL'si ise (data:image/) doğrudan döndür
  if (url.startsWith('data:image/')) return url;
  
  // URL http veya https ile başlamıyorsa, göreceli yol olarak değerlendir
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url.startsWith('/') ? url : `/${url}`;
  }
  
  return url;
}

/**
 * Görseli belirli bir boyuta yeniden boyutlandırır
 * @param url Görsel URL'si
 * @param width İstenen genişlik
 * @param height İstenen yükseklik
 * @returns Boyutlandırılmış görsel URL'si
 */
export function resizeImage(url: string, width: number = 300, height: number = 450): string {
  // Görsel URL'sini doğrula
  const validatedUrl = validateImageUrl(url);
  
  // OpenLibrary görseli ise boyutlandırma parametrelerini ekle
  if (validatedUrl.includes('covers.openlibrary.org')) {
    // OpenLibrary görseli için boyut parametresini değiştir
    return validatedUrl.replace(/(-[SM]\.jpg)$/, `-L.jpg`);
  }
  
  // Google Books API görseli ise boyutlandırma parametrelerini ekle
  if (validatedUrl.includes('books.google.com')) {
    return validatedUrl.replace(/&zoom=\d+/, `&zoom=1`) + `&printsec=frontcover&img=1&source=gbs_api`;
  }
  
  // Diğer URL'ler için orijinal URL'yi döndür
  return validatedUrl;
}