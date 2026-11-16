import { EmptyState } from '@/components/ui/empty-state'
import type { PhotoSummary } from '@/lib/content'

import { PhotoTile } from './photo-tile'

/** Tiles that load at once: about the first screen at every tier. */
const EAGER_TILES = 3

interface PhotoGridProps {
  album: string
  photos: PhotoSummary[]
}

/**
 * Photos in album order, as a masonry of CSS columns that keeps each photo's
 * aspect ratio: one column on phones, two from the medium tier and three
 * from the full tier. Columns fill top to bottom, one after the other.
 */
export function PhotoGrid({ album, photos }: PhotoGridProps) {
  if (photos.length === 0) {
    return <EmptyState>No photos yet. Check back soon.</EmptyState>
  }

  return (
    <ul
      aria-label="Photos in this album"
      className="columns-1 gap-x-6 md:columns-2 xl:columns-3"
    >
      {photos.map((photo, index) => (
        <li key={photo.slug} className="mb-8 break-inside-avoid">
          <PhotoTile album={album} photo={photo} eager={index < EAGER_TILES} />
        </li>
      ))}
    </ul>
  )
}
