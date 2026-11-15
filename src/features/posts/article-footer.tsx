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
 * collection, then a small, unobtrusive link for reporting a mistake.
 */
export function ArticleFooter({ neighbours }: ArticleFooterProps) {
  const { previous, next } = neighbours
  return (
    <footer className="mt-14 border-t border-border pt-6">
      {(previous ?? next) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {previous && <NeighbourCard post={previous} direction="previous" />}
          {next && (
            <div className="sm:col-start-2">
              <NeighbourCard post={next} direction="next" />
            </div>
          )}
        </div>
      )}
      <p className="mt-3 flex justify-end">
        <a
          href={REPORT_ISSUE_URL}
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center font-mono text-meta text-fg-muted transition-colors duration-150 hover:text-fg"
        >
          Found a mistake? Report an issue
          <span aria-hidden="true">&nbsp;↗</span>
        </a>
      </p>
    </footer>
  )
}
