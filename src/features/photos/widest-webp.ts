import type { PhotoSummary } from '@/lib/content'

export interface ImageFile {
  url: string
  width: number
  height: number
}

/**
 * The widest WebP variant of an image, read from its `srcSet`, with the
 * height that keeps its aspect ratio. Undefined without a WebP source.
 */
export function widestWebp(
  image: Pick<PhotoSummary['image'], 'width' | 'height' | 'sources'>
): ImageFile | undefined {
  const webp = image.sources.find(source => source.type === 'image/webp')
  if (!webp) return undefined
  let widest: ImageFile | undefined
  // Candidates are `url 640w`; media URLs never contain spaces or commas.
  for (const candidate of webp.srcSet.split(',')) {
    const [url, descriptor] = candidate.trim().split(' ')
    const width = Number.parseInt(descriptor ?? '', 10)
    if (!url || !Number.isInteger(width)) continue
    if (widest && widest.width >= width) continue
    widest = {
      url,
      width,
      height: Math.round((width * image.height) / image.width),
    }
  }
  return widest
}
