import { NeighbourCard } from '@/components/ui/neighbour-card'
import type { PhotoSummary } from '@/lib/content'
import type { Neighbours } from '@/lib/utils'

type NeighbourPhoto = Pick<PhotoSummary, 'slug' | 'title'>

interface PhotoFooterProps {
  neighbours: Neighbours<NeighbourPhoto>
}

/**
 * Cards for the previous (older) and next (newer) photo. The way back to
 * the gallery is the breadcrumb at the top of the page.
 */
export function PhotoFooter({ neighbours }: PhotoFooterProps) {
  const { previous, next } = neighbours
  if (!previous && !next) return null
  return (
    <nav
      aria-label="More photos"
      className="mt-14 grid gap-3 border-t border-border pt-6 sm:grid-cols-2"
    >
      {previous && (
        <NeighbourCard
          href={`/photos/${previous.slug}`}
          title={previous.title}
          direction="previous"
        />
      )}
      {next && (
        <div className="sm:col-start-2">
          <NeighbourCard
            href={`/photos/${next.slug}`}
            title={next.title}
            direction="next"
          />
        </div>
      )}
    </nav>
  )
}
