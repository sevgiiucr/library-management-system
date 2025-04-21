/**
 * Tailwind CSS Konfigürasyon Dosyası
 * 
 * Bu dosya, projenin Tailwind CSS yapılandırmasını tanımlar.
 * Tema uzantıları, eklentiler ve içerik yolları burada belirtilir.
 */
module.exports = {
  // JIT modunu zorunlu aç
  mode: "jit",
  // İçerik yolları - Tailwind CSS'in hangi dosyaları tarayacağını belirtir
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',     // App klasöründeki tüm dosyalar
    './pages/**/*.{js,ts,jsx,tsx,mdx}',   // Pages klasöründeki tüm dosyalar
    './components/**/*.{js,ts,jsx,tsx,mdx}', // Components klasöründeki tüm dosyalar
  ],
  
  // Safelist - JIT modunda daima dahil edilecek sınıflar
  safelist: [
    // Temel stiller
    'w-full',
    'h-full',
    'min-h-screen',
    'flex',
    'flex-col',
    'items-center',
    'justify-center',
    'justify-between',
    'space-y-4',
    // Renk sınıfları
    'bg-black',
    'bg-gray-900',
    'bg-gray-800',
    'bg-gray-700',
    'bg-gray-600',
    'bg-purple-900',
    'bg-indigo-800',
    'text-white',
    'text-gray-400',
    'text-gray-300',
    'text-amber-400',
    'text-amber-500',
    'text-amber-600',
    'text-purple-300',
    'text-purple-400',
    'text-purple-500',
    'text-blue-400',
    'text-violet-400',
    'text-emerald-400',
    'text-rose-400',
    'border-gray-700',
    'border-gray-600',
    'border-purple-700',
    'border-purple-500',
    'hover:border-purple-500',
    'hover:text-purple-300',
    'group-hover:text-purple-400',
    // Layout sınıfları
    'container',
    'mx-auto',
    'px-4',
    'px-6',
    'px-8',
    'pt-20',
    'pt-24',
    'py-4',
    'py-6',
    'py-8',
    'py-12',
    'py-16',
    'pb-16',
    'mb-2',
    'mb-3',
    'mb-4',
    'mb-8',
    'mb-12',
    'mb-16',
    'mb-20',
    'max-w-3xl',
    'max-w-4xl',
    'max-w-7xl',
    // Grid sınıfları
    'grid',
    'grid-cols-1',
    'grid-cols-2',
    'md:grid-cols-2',
    'md:grid-cols-3',
    'lg:grid-cols-3',
    'lg:grid-cols-4',
    'gap-4',
    'gap-6',
    'gap-8',
    // Background sınıfları
    'bg-gradient-to-br',
    'bg-gradient-to-r',
    'from-gray-900',
    'from-purple-900',
    'from-gray-800/80',
    'to-purple-900/80',
    'to-indigo-800',
    'to-violet-800',
    'bg-gray-800/50',
    'bg-gray-800/30',
    'backdrop-blur-sm',
    'backdrop-blur-md',
    // Boyut sınıfları
    'text-3xl',
    'text-2xl',
    'text-xl',
    'text-lg',
    'text-sm',
    'text-5xl',
    'text-4xl',
    'md:text-4xl',
    'md:text-5xl',
    // Padding ve margin
    'p-4',
    'p-6',
    'p-8',
    // Border ve gölge
    'border',
    'rounded-lg',
    'rounded-xl',
    'rounded-2xl',
    'rounded-full',
    'shadow-md',
    'shadow-lg',
    'overflow-hidden',
    // Konumlandırma
    'text-center',
    'text-right',
    'inline-block',
    'relative',
    'absolute',
    'inset-0',
    'z-10',
    'opacity-20',
    // Geçiş efektleri
    'transition-colors',
    'transition-all',
    'duration-300',
    // Font stilleri
    'font-bold',
    'font-medium',
    'font-semibold',
    // Animasyon
    'animate-spin',
    'border-t-2',
    'border-b-2',
    'border-purple-500',
    // Cursor
    'cursor-pointer',
    // Grup
    'group',
  ],
  
  theme: {
    // Varsayılan temayı genişletir (override etmek yerine)
    extend: {
      // Özel font ailelerini tanımlar
      fontFamily: {
        playfair: ['var(--font-playfair)'],   // Playfair Display fontu
        poppins: ['var(--font-poppins)'],     // Poppins fontu
      },
      
      // Özel renkleri tanımlar
      colors: {
        gold: '#d97706', // Amber-600 tonu (altın rengi)
      },
      
      // Arka plan görüntülerini tanımlar
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      
      // Özel animasyonları tanımlar
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out', // Fade-in animasyonu
      },
      
      // Özel keyframe'leri tanımlar
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },    // Başlangıç durumu (görünmez)
          '100%': { opacity: '1' },  // Son durum (tamamen görünür)
        },
      },
    },
  },
  
  // Tailwind CSS eklentileri
  plugins: [
    // Form elemanları için eklenti
    require('@tailwindcss/forms'),
    
    // Özel kullanıcı tanımlı yardımcı sınıflar
    function({ addUtilities }) {
      addUtilities({
        // Dancing Script fontu için özel yardımcı sınıf
        '.dancing-script': {
          fontFamily: '"Dancing Script", cursive',
        },
      })
    },
  ],
} 