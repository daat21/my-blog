import Link from 'next/link'

import { MediaImage } from '@/components/ui/media-image'
import type { PhotoSummary } from '@/lib/content'

import { GALLERY_SIZES } from './image-sizes'

interface PhotoTileProps {
  album: string
  photo: Pick<PhotoSummary, 'slug' | 'title' | 'taken' | 'image' | 'alt'>
  /** Load the image at once, for tiles likely on the first screen. */
  eager?: boolean
}

/**
 * One photo in the gallery at its own aspect ratio, with a mono caption of
 * title and date. Until the image loads, its dominant colour holds its
 * place. The title link covers the whole tile.
 */
export function PhotoTile({ album, photo, eager = false }: PhotoTileProps) {
  return (
    <article className="group relative flex flex-col gap-2.5 rounded-md has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-accent">
      <div
        className="overflow-hidden rounded-md bg-sunken"
        style={{ backgroundColor: photo.image.color }}
      >
        <MediaImage
          image={photo.image}
          alt={photo.alt}
          sizes={GALLERY_SIZES}
          loading={eager ? 'eager' : 'lazy'}
          className="block h-auto w-full transition-opacity duration-150 group-hover:opacity-90"
        />
      </div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <h2 className="min-w-0 text-fg">
          <Link
            href={`/photos/${album}/${photo.slug}`}
            className="transition-colors duration-150 outline-none group-hover:text-accent before:absolute before:inset-0 before:content-['']"
          >
            {photo.title}
          </Link>
        </h2>
        {photo.taken && (
          <time
            dateTime={photo.taken.replace(' ', 'T')}
            className="shrink-0 font-mono text-meta text-fg-muted"
          >
            {photo.taken.includes(' ') ? photo.taken.slice(11) : photo.taken}
          </time>
        )}
      </div>
    </article>
  )
}
