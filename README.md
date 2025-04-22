# Kütüphane Yönetim Sistemi

Modern ve kullanıcı dostu bir kütüphane yönetim sistemi. Kitapları kategorize etme, ödünç alma/iade etme ve favorilere ekleme gibi temel işlevleri sunan web tabanlı bir uygulama.

![Kütüphane Yönetim Sistemi](public/library1.jpg)

## Özellikler

- 📚 **Kitap Yönetimi**: Kitap ekleme, düzenleme, listeleme ve kategorizasyon
- 👥 **Kullanıcı Yönetimi**: Kayıt, giriş, profil düzenleme, kullanıcı tipleri (admin/üye)
- 📖 **Ödünç Alma Sistemi**: Kitap ödünç alma, iade işlemleri, gecikmeler için bildirimler
- ❤️ **Favoriler**: Kullanıcıların sevdikleri kitapları kaydetmesi
- 📊 **Raporlama**: Admin için detaylı istatistikler ve raporlar
- 🎨 **Modern UI**: Responsive tasarım, koyu/açık tema desteği

## Teknik Altyapı

- **Frontend**: React, Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Veritabanı**: Prisma ORM ile SQL veritabanı (MSSQL)
- **State Yönetimi**: Context API
- **API Entegrasyonu**: RESTful API
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## Başlangıç

### Gereksinimler

- Node.js 18.x veya üzeri
- npm
- MSSQL (Microsoft SQL Server) veritabanı

### Kurulum

1. Repoyu klonlayın:
   ```bash
   git clone https://github.com/yourusername/library-management-system.git
   cd library-management-system
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   # veya
   yarn install
   ```

3. `.env` dosyasını oluşturun ve gerekli değişkenleri ayarlayın:
   ```
   DATABASE_URL="sqlserver://localhost:1433;database=library;user=username;password=password;trustServerCertificate=true"
   JWT_SECRET="your-jwt-secret"
   ```

4. Prisma şemasını veritabanına uygulayın:
   ```bash
   npx prisma migrate dev
   ```

5. Örnek verileri yükleyin:
   ```bash
   npm run seed
   ```

6. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

7. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine gidin.

## Proje Yapısı

```
library-management-system/
├── app/               # Next.js uygulama klasörü
│   ├── api/           # API route'ları
│   ├── components/    # React bileşenleri
│   ├── admin/         # Admin sayfaları
│   ├── books/         # Kitap sayfaları
│   ├── dashboard/     # Kullanıcı dashboard sayfası
│   └── lib/           # Yardımcı fonksiyonlar
├── prisma/            # Veritabanı şemaları ve seed
├── public/            # Statik dosyalar
└── PRD.md             # Proje Gereksinim Dokümanı
```

## Geliştirme Planı

Projenin detaylı geliştirme planı [PRD.md](PRD.md) dosyasında mevcuttur. Bu belge, iki haftalık sprintler halinde planlanan 10 sprint boyunca gerçekleştirilecek çalışmaları içermektedir.

## Katkıda Bulunma

1. Bu repo'yu fork edin
2. Kendi branch'inizi oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## İletişim

Proje Sahibi - [@your-twitter](https://twitter.com/your-twitter)

Proje Linki: [https://github.com/yourusername/library-management-system](https://github.com/yourusername/library-management-system)
