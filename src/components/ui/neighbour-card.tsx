import type { Route } from 'next'

import { LinkCard } from './link-card'

interface NeighbourCardProps<T extends string> {
  href: Route<T>
  title: string
  /** `previous` links to the older item, `next` to the newer one. */
  direction: 'previous' | 'next'
}

/** A card linking to the previous or next item of a newest-first series. */
export function NeighbourCard<T extends string>({
  href,
  title,
  direction,
}: NeighbourCardProps<T>) {
  const previous = direction === 'previous'
  return (
    <LinkCard
      href={href}
      rel={previous ? 'prev' : 'next'}
      align={previous ? 'start' : 'end'}
      label={
        previous ? (
          <>
            <span aria-hidden="true">←&nbsp;</span>previous
          </>
        ) : (
          <>
            next<span aria-hidden="true">&nbsp;→</span>
          </>
        )
      }
      title={title}
    />
  )
}
