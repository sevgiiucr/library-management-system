import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});


//next.js ve typscript kurallarını uygulayarak  next.js için optimize edilmiş kod yazılabilir. 
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Uzun vadeli hata düzeltme stratejisi
  {
    rules: {
      // 'any' kullanımını warn seviyesine düşürelim
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Kullanılmayan değişkenleri warn seviyesine düşürelim
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }],
      
      // React hook bağımlılıkları
      "react-hooks/exhaustive-deps": "warn",
      
      // HTML img yerine Next.js Image komponenti
      "@next/next/no-img-element": "warn"
    }
  }
];

export default eslintConfig;
