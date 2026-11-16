import { Fragment } from 'react'

import { SeparatedList } from '@/components/ui/separated-list'
import { Tag } from '@/components/ui/tag'
import type { PostSummary } from '@/lib/content'

interface ArticleHeaderProps {
  post: Pick<
    PostSummary,
    'title' | 'description' | 'date' | 'updated' | 'readingMinutes' | 'tags'
  >
}

/** Title, dek and a mono meta row: dates, reading time and tags. */
export function ArticleHeader({ post }: ArticleHeaderProps) {
  return (
    <header className="mt-7 mb-10 flex flex-col gap-3.5 border-b border-border pb-8">
      <h1 className="text-h1 font-semibold tracking-[-0.022em] text-balance text-fg">
        {post.title}
      </h1>
      <p className="text-lead text-fg-muted">{post.description}</p>
      <div className="pt-1.5 font-mono text-meta text-fg-muted">
        <SeparatedList
          className="contents"
          trailingSeparator={post.tags.length > 0}
          items={[
            <time key="date" dateTime={post.date}>
              {post.date}
            </time>,
            ...(post.updated
              ? [
                  <span key="updated">
                    updated <time dateTime={post.updated}>{post.updated}</time>
                  </span>,
                ]
              : []),
            `${post.readingMinutes} min read`,
          ]}
        />{' '}
        {post.tags.map((tag, index) => (
          <Fragment key={tag}>
            {index > 0 && ' '}
            <Tag tag={tag} />
          </Fragment>
        ))}
      </div>
    </header>
  )
}
