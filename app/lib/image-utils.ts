/**
 * Image utility functions for processing and validating image uploads
 */

/**
 * Validates an image by checking its size and format
 * @param {string} base64String - Base64 encoded image string
 * @param {number} maxSizeInBytes - Maximum allowed size in bytes (default: 5MB)
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateImage(base64String: string, maxSizeInBytes: number = 5 * 1024 * 1024): boolean {
  if (!base64String) return false;
  
  // Check for valid Base64 format
  if (!base64String.startsWith('data:image/')) {
    return false;
  }
  
  // Check file size
  // Base64 strings are approximately 33% larger than their binary counterparts
  // We can estimate the binary size by removing the header and calculating based on the remaining string
  const base64WithoutHeader = base64String.split(',')[1];
  if (!base64WithoutHeader) return false;
  
  const approximateBytes = Math.ceil((base64WithoutHeader.length * 3) / 4);
  return approximateBytes <= maxSizeInBytes;
}

/**
 * Compress an image by reducing its quality
 * @param {string} base64String - Base64 encoded image string
 * @param {number} quality - Quality level (0-1, default: 0.7)
 * @returns {Promise<string>} - Compressed base64 image string
 */
export async function compressImage(base64String: string, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!base64String) {
      reject(new Error('No image provided'));
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    img.onerror = () => {
      reject(new Error('Error loading image'));
    };
    
    img.src = base64String;
  });
}

/**
 * Extract image format from a base64 string
 * @param {string} base64String - Base64 encoded image string
 * @returns {string} - Format (e.g., 'jpeg', 'png')
 */
export function getImageFormat(base64String: string): string {
  if (!base64String || !base64String.startsWith('data:image/')) {
    return 'unknown';
  }
  
  const match = base64String.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
  return match ? match[1] : 'unknown';
}

/**
 * Generate unique filename for an image
 * @param {string} prefix - Prefix for the filename (default: 'image')
 * @param {string} format - Image format (e.g., 'jpeg', 'png')
 * @returns {string} - Unique filename
 */
export function generateUniqueFilename(prefix: string = 'image', format: string = 'jpeg'): string {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomString}.${format}`;
} 