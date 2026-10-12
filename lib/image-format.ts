import { storage } from '#imports'

export type ImageFormat = 'webp' | 'png'

export const DEFAULT_IMAGE_FORMAT: ImageFormat = 'webp'

export const IMAGE_FORMATS: { value: ImageFormat; label: string; description: string }[] = [
  { value: 'webp', label: 'WebP', description: '有损高质量（0.95），体积通常只有 PNG 的几分之一。' },
  { value: 'png', label: 'PNG', description: '无损，画质与原始帧完全一致，但文件较大。' },
]

/** WebP 用 0.95：肉眼几乎看不出差别，体积比无损小得多。PNG 忽略这个参数。 */
export const WEBP_QUALITY = 0.95

export const imageFormatItem = storage.defineItem<ImageFormat>('local:imageFormat', {
  fallback: DEFAULT_IMAGE_FORMAT,
})
