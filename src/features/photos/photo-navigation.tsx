import { cva } from 'class-variance-authority'
import Link from 'next/link'

import type { Photo } from '@/lib/content'
import { cn } from '@/lib/utils'

const navigation = cva('items-center', {
  variants: {
    layout: {
      frame:
        'pointer-events-none absolute inset-x-3 top-1/2 hidden -translate-y-1/2 justify-between xl:flex',
      stacked:
        'grid grid-cols-[1fr_auto_1fr] gap-2 border-b border-border py-1 xl:hidden',
    },
  },
})

const control = cva(
  'row-start-1 inline-flex min-h-11 min-w-11 items-center justify-center text-ui font-medium text-fg',
  {
    variants: {
      layout: {
        frame:
          'pointer-events-auto size-11 rounded-full border border-border-strong bg-surface/90 hover:text-accent',
        stacked: 'gap-2 rounded-md px-3 hover:text-accent',
      },
    },
  }
)

/** Real links with disabled ends, over the frame or in a centred touch row. */
export function PhotoNavigation({
  photo,
  layout,
}: {
  photo: Photo
  layout: 'frame' | 'stacked'
}) {
  return (
    <nav aria-label="Photo navigation" className={navigation({ layout })}>
      {(['previous', 'next'] as const).map((direction, index) => {
        const neighbour = photo[direction]
        const label = direction === 'previous' ? 'Previous' : 'Next'
        const content =
          layout === 'frame' ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="size-5"
            >
              <path
                d={direction === 'previous' ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6'}
              />
            </svg>
          ) : direction === 'previous' ? (
            '← Previous'
          ) : (
            'Next →'
          )
        const className = cn(
          control({ layout }),
          index === 0
            ? 'col-start-1 justify-self-start'
            : 'col-start-3 justify-self-end',
          !neighbour && 'pointer-events-none opacity-40'
        )
        return neighbour ? (
          <Link
            key={direction}
            className={className}
            rel={direction === 'previous' ? 'prev' : 'next'}
            href={`/photos/${photo.album.slug}/${neighbour.slug}`}
            aria-label={`${label} photo: ${neighbour.title}`}
          >
            {content}
          </Link>
        ) : (
          <button
            key={direction}
            type="button"
            disabled
            aria-disabled="true"
            aria-label={`${label} photo`}
            className={className}
          >
            {content}
          </button>
        )
      })}
      {layout === 'stacked' && (
        <output
          aria-label="Photo position"
          className="col-start-2 row-start-1 font-mono text-meta text-fg-muted"
        >
          <span className="text-fg">{photo.position}</span> /{' '}
          {photo.album.count}
        </output>
      )}
    </nav>
  )
}
