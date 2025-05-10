/**
 * PostCSS Yapılandırma Dosyası
 * 
 * Bu dosya, projede kullanılan CSS işleme eklentilerini ve bu eklentilerin 
 * yapılandırmasını tanımlar. PostCSS, CSS dosyalarını dönüştürmek için 
 * kullanılan bir araçtır ve modüler bir yapıya sahiptir.
 * 
 * @tailwindcss/postcss: Tailwind CSS 4'ün PostCSS eklentisidir. Tailwind direktiflerini
 * ve sınıflarını işler, CSS dosyalarınızı Tailwind direktiflerine göre dönüştürür.
 * 
 * autoprefixer: Farklı tarayıcılar için gerekli olan önekleri (prefix) otomatik olarak
 * CSS kurallarına ekler. Örneğin '-webkit-', '-moz-' gibi önekler.
 */
export default {
  plugins: {
    '@tailwindcss/postcss': {}, // Tailwind CSS 4 için PostCSS eklentisi
    'autoprefixer': {},         // Tarayıcı uyumluluğu için önek ekleyen eklenti
  },
};
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
} 