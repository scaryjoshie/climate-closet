// Utility functions for image processing and compression

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp'
}

export const compressImage = (
  file: File, 
  options: CompressionOptions = {}
): Promise<string> => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    format = 'jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      // Scale down if needed
      const ratio = Math.min(maxWidth / width, maxHeight / height)
      if (ratio < 1) {
        width *= ratio
        height *= ratio
      }
      
      // Set canvas dimensions
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to compressed base64
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const reader = new FileReader()
              reader.onload = () => {
                const result = reader.result as string
                const base64 = result.split(',')[1]
                resolve(base64)
              }
              reader.onerror = reject
              reader.readAsDataURL(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          `image/${format}`,
          quality
        )
      } else {
        reject(new Error('Canvas context not available'))
      }
    }
    
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export const getImageSizeInfo = (file: File): string => {
  const sizeInMB = (file.size / (1024 * 1024)).toFixed(2)
  return `${sizeInMB} MB`
}

export const shouldCompressImage = (file: File, maxSizeMB: number = 2): boolean => {
  return file.size > (maxSizeMB * 1024 * 1024)
}

export const createDataUrl = (base64: string, mimeType: string = 'image/jpeg'): string => {
  return `data:${mimeType};base64,${base64}`
} 