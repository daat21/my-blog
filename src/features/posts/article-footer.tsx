import Link from 'next/link'

import type { PostSummary } from '@/lib/content'
import { cn } from '@/lib/utils'

import type { Neighbours } from './neighbours'

/** Readers report mistakes on the public code repository. */
const REPORT_ISSUE_URL = 'https://github.com/daat21/my-blog/issues/new'

const CARD =
  'flex flex-col gap-1 rounded-md border px-4.5 py-4 transition-colors duration-150'
const CARD_LABEL = 'font-mono text-meta text-fg-muted'
const CARD_TITLE = 'text-ui leading-[1.45] font-medium text-fg'

type NeighbourPost = Pick<PostSummary, 'collection' | 'slug' | 'title'>

function NeighbourCard({
  post,
  direction,
}: {
  post: NeighbourPost
  direction: 'previous' | 'next'
}) {
  return (
    <Link
      href={`/${post.collection}/${post.slug}`}
      rel={direction === 'previous' ? 'prev' : 'next'}
      className={cn(
        CARD,
        'border-border hover:border-border-strong',
        direction === 'next' && 'sm:items-end sm:text-right'
      )}
    >
      <span className={CARD_LABEL}>
        {direction === 'previous' ? (
          <>
            <span aria-hidden="true">←&nbsp;</span>previous
          </>
        ) : (
          <>
            next<span aria-hidden="true">&nbsp;→</span>
          </>
        )}
      </span>
      <span className={CARD_TITLE}>{post.title}</span>
    </Link>
  )
}

interface ArticleFooterProps {
  neighbours: Neighbours<NeighbourPost>
}

/**
 * Cards for the previous (older) and next (newer) post in the same
 * collection, and one for reporting a mistake. Two cards share a row; a
 * third, or a lone one, takes the full width.
 */
export function ArticleFooter({ neighbours }: ArticleFooterProps) {
  const { previous, next } = neighbours
  return (
    <footer className="mt-14 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
      {previous && <NeighbourCard post={previous} direction="previous" />}
      {next && <NeighbourCard post={next} direction="next" />}
      <a
        href={REPORT_ISSUE_URL}
        rel="noopener noreferrer"
        className={cn(
          CARD,
          'justify-center border-dashed border-border-strong hover:border-fg-muted sm:odd:col-span-2'
        )}
      >
        <span className={CARD_LABEL}>found a mistake?</span>
        <span className={CARD_TITLE}>
          Report an issue<span aria-hidden="true">&nbsp;↗</span>
        </span>
      </a>
    </footer>
  )
}
