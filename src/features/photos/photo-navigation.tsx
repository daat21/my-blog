import Link from 'next/link'

import type { Photo } from '@/lib/content'

/** Real links with quiet disabled ends and a position counter. */
export function PhotoNavigation({ photo }: { photo: Photo }) {
  const linkClass =
    'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md px-3 text-ui font-medium text-fg hover:text-accent xl:border xl:border-border-strong'
  return (
    <nav
      aria-label="Photo navigation"
      className="flex items-center justify-between gap-2 border-b border-border py-1 xl:border-0 xl:py-0"
    >
      {photo.previous ? (
        <Link
          className={linkClass}
          rel="prev"
          href={`/photos/${photo.album.slug}/${photo.previous.slug}`}
        >
          ← Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={`${linkClass} text-fg-muted`}>
          ← Previous
        </span>
      )}
      <span className="shrink-0 font-mono text-meta text-fg-muted">
        <span className="text-fg">{photo.position}</span>
        <span className="xl:hidden"> / </span>
        <span className="hidden xl:inline"> of </span>
        {photo.album.count}
      </span>
      {photo.next ? (
        <Link
          className={linkClass}
          rel="next"
          href={`/photos/${photo.album.slug}/${photo.next.slug}`}
        >
          Next →
        </Link>
      ) : (
        <span aria-disabled="true" className={`${linkClass} text-fg-muted`}>
          Next →
        </span>
      )}
    </nav>
  )
}
