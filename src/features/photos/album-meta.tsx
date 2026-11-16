import type { AlbumSummary } from '@/lib/content'

/** Shared dates, place and visible-photo count for an album. */
export function AlbumMeta({ album }: { album: AlbumSummary }) {
  return (
    <p className="flex flex-wrap gap-x-2.5 gap-y-1 font-mono text-meta text-fg-muted">
      <span>
        <time dateTime={album.date}>{album.date}</time>
        {album.endDate && (
          <>
            {' '}
            → <time dateTime={album.endDate}>{album.endDate}</time>
          </>
        )}
      </span>
      {album.location && (
        <>
          <span aria-hidden="true">·</span>
          <span>{album.location}</span>
        </>
      )}
      <span aria-hidden="true">·</span>
      <span>
        {album.count} {album.count === 1 ? 'photo' : 'photos'}
      </span>
    </p>
  )
}
