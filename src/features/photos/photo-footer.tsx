import { LinkCard } from '@/components/ui/link-card'
import { NeighbourCard } from '@/components/ui/neighbour-card'
import type { PhotoSummary } from '@/lib/content'
import type { Neighbours } from '@/lib/utils'

type NeighbourPhoto = Pick<PhotoSummary, 'slug' | 'title'>

interface PhotoFooterProps {
  neighbours: Neighbours<NeighbourPhoto>
}

/**
 * Cards for the previous (older) and next (newer) photo, and one back to
 * the gallery. Two cards share a row; a third, or a lone one, takes the
 * full width.
 */
export function PhotoFooter({ neighbours }: PhotoFooterProps) {
  const { previous, next } = neighbours
  return (
    <footer className="mt-14 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
      {previous && (
        <NeighbourCard
          href={`/photos/${previous.slug}`}
          title={previous.title}
          direction="previous"
        />
      )}
      {next && (
        <NeighbourCard
          href={`/photos/${next.slug}`}
          title={next.title}
          direction="next"
        />
      )}
      <LinkCard
        href="/photos"
        variant="dashed"
        className="sm:odd:col-span-2"
        label="back to the gallery"
        title="All photos"
      />
    </footer>
  )
}
