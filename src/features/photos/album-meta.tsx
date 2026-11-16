import { SeparatedList } from '@/components/ui/separated-list'
import type { AlbumSummary } from '@/lib/content'

/** Shared dates, place and visible-photo count for an album. */
export function AlbumMeta({ album }: { album: AlbumSummary }) {
  return (
    <p className="font-mono text-meta text-fg-muted">
      <SeparatedList
        items={[
          <span key="dates">
            <time dateTime={album.date}>{album.date}</time>
            {album.endDate && (
              <>
                {' '}
                → <time dateTime={album.endDate}>{album.endDate}</time>
              </>
            )}
          </span>,
          ...(album.location ? [album.location] : []),
          `${album.count} ${album.count === 1 ? 'photo' : 'photos'}`,
        ]}
      />
    </p>
  )
}
