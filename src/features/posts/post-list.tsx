import { EmptyState } from '@/components/ui/empty-state'
import type { PostSummary } from '@/lib/content'

import { PostRow } from './post-row'

interface PostListProps {
  posts: PostSummary[]
  /** Shown instead of the list when there are no posts. */
  emptyMessage?: string
}

/** Posts, newest first, one row each. */
export function PostList({
  posts,
  emptyMessage = 'Nothing here yet. Check back soon.',
}: PostListProps) {
  if (posts.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {posts.map(post => (
        <li key={post.slug}>
          <PostRow post={post} />
        </li>
      ))}
    </ul>
  )
}
