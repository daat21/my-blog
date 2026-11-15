import type { PostSummary } from '@/lib/content'

import { PostRow } from './post-row'

interface PostListProps {
  posts: PostSummary[]
  /** Name each post's collection, for lists that mix both. */
  showCollection?: boolean
  /** Shown instead of the list when there are no posts. */
  emptyMessage?: string
}

/** Posts, newest first, one row each. */
export function PostList({
  posts,
  showCollection,
  emptyMessage = 'Nothing here yet. Check back soon.',
}: PostListProps) {
  if (posts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border-strong px-6 py-10 text-center text-sm text-fg-muted">
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {posts.map(post => (
        <li key={`${post.collection}/${post.slug}`}>
          <PostRow post={post} showCollection={showCollection} />
        </li>
      ))}
    </ul>
  )
}
