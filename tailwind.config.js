/**
 * Tailwind CSS Konfigürasyon Dosyası
 * 
 * Bu dosya, projenin Tailwind CSS yapılandırmasını tanımlar.
 * Tema uzantıları, eklentiler ve içerik yolları burada belirtilir.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  // JIT modunu zorunlu aç
  mode: "jit",
  // İçerik yolları - Tailwind CSS'in hangi dosyaları tarayacağını belirtir
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
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
    'space-y-6',
    // Renk sınıfları
    'bg-black',
    'bg-black/60',
    'bg-gray-900',
    'bg-gray-800',
    'bg-gray-800/90',
    'bg-gray-700',
    'bg-gray-700/50',
    'bg-gray-600',
    'bg-purple-900',
    'bg-purple-600',
    'bg-purple-700',
    'bg-indigo-800',
    'text-white',
    'text-gray-400',
    'text-gray-300',
    'text-gray-200',
    'text-amber-400',
    'text-amber-500',
    'text-amber-600',
    'text-purple-300',
    'text-purple-400',
    'text-purple-500',
    'border-gray-700',
    'border-gray-600',
    'border-purple-700',
    'border-purple-500',
    'border-red-800',
    'hover:border-purple-500',
    'hover:text-purple-300',
    'hover:text-gray-200',
    'hover:bg-purple-700',
    'focus:border-purple-500',
    'focus:ring-purple-500',
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
    'mb-6',
    'mb-8',
    'mb-12',
    'mb-16',
    'mb-20',
    'mt-4',
    'max-w-3xl',
    'max-w-4xl',
    'max-w-7xl',
    'max-w-md',
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
    'bg-red-900/50',
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
    'p-3',
    'p-4',
    'p-6',
    'p-8',
    // Border ve gölge
    'border',
    'rounded-md',
    'rounded-lg',
    'rounded-xl',
    'rounded-2xl',
    'rounded-full',
    'shadow-md',
    'shadow-lg',
    'shadow-xl',
    'shadow-2xl',
    'overflow-hidden',
    // Konumlandırma
    'text-center',
    'text-right',
    'inline-block',
    'relative',
    'absolute',
    'fixed',
    'inset-0',
    'z-10',
    'z-50',
    'transform',
    'opacity-20',
    'opacity-70',
    // Geçiş efektleri
    'transition-colors',
    'transition-all',
    'duration-150',
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
    'cursor-not-allowed',
    // Grup
    'group',
    // Diğer
    'disabled:opacity-70',
    'disabled:cursor-not-allowed',
    'focus:ring-1',
    'focus:ring-offset-0',
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
        primary: {
          400: '#818cf8',  // indigo-400
          500: '#6366f1',  // indigo-500
          600: '#4f46e5',  // indigo-600
          700: '#4338ca',  // indigo-700
          800: '#3730a3',  // indigo-800
        },
      },
      
      // Arka plan görüntülerini tanımlar
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  
  // Tailwind CSS eklentileri
  plugins: [require('@tailwindcss/forms')],
} 