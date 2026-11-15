import { NeighbourCard } from '@/components/ui/neighbour-card'
import type { PostSummary } from '@/lib/content'
import type { Neighbours } from '@/lib/utils'

/** Readers report mistakes on the public code repository. */
const REPORT_ISSUE_URL = 'https://github.com/daat21/my-blog/issues/new'

type NeighbourPost = Pick<PostSummary, 'slug' | 'title'>

interface ArticleFooterProps {
  neighbours: Neighbours<NeighbourPost>
}

/**
 * Cards for the previous (older) and next (newer) post, then a small,
 * unobtrusive link for reporting a mistake.
 */
export function ArticleFooter({ neighbours }: ArticleFooterProps) {
  const { previous, next } = neighbours
  return (
    <footer className="mt-14 border-t border-border pt-6">
      {(previous ?? next) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {previous && (
            <NeighbourCard
              href={`/writing/${previous.slug}`}
              title={previous.title}
              direction="previous"
            />
          )}
          {next && (
            <div className="sm:col-start-2">
              <NeighbourCard
                href={`/writing/${next.slug}`}
                title={next.title}
                direction="next"
              />
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
