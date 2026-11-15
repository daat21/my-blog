import { Tag } from '@/components/ui/tag'
import type { PostSummary } from '@/lib/content'

interface ArticleHeaderProps {
  post: Pick<
    PostSummary,
    'title' | 'description' | 'date' | 'updated' | 'readingMinutes' | 'tags'
  >
}

function Dot() {
  return <span aria-hidden="true">·</span>
}

/** Title, dek and a mono meta row: dates, reading time and tags. */
export function ArticleHeader({ post }: ArticleHeaderProps) {
  return (
    <header className="mt-7 mb-10 flex flex-col gap-3.5 border-b border-border pb-8">
      <h1 className="text-h1 font-semibold tracking-[-0.022em] text-balance text-fg">
        {post.title}
      </h1>
      <p className="text-lead text-fg-muted">{post.description}</p>
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 pt-1.5 font-mono text-meta text-fg-muted">
        <time dateTime={post.date}>{post.date}</time>
        {post.updated && (
          <>
            <Dot />
            <span>
              updated <time dateTime={post.updated}>{post.updated}</time>
            </span>
          </>
        )}
        <Dot />
        <span>{post.readingMinutes} min read</span>
        {post.tags.length > 0 && <Dot />}
        {post.tags.map(tag => (
          <Tag key={tag} tag={tag} />
        ))}
      </div>
    </header>
  )
}
