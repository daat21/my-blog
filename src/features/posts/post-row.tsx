import Link from 'next/link'

import { Tag } from '@/components/ui/tag'
import type { PostSummary } from '@/lib/content'

import { COLLECTIONS } from './collections'

interface PostRowProps {
  post: Pick<
    PostSummary,
    'collection' | 'slug' | 'title' | 'description' | 'date' | 'tags'
  >
  /** Name the collection next to the date, for lists that mix both. */
  showCollection?: boolean
}

/**
 * One post in a list: date, title, description and tags. The title link
 * covers the whole row, and the tag links sit above it.
 */
export function PostRow({ post, showCollection = false }: PostRowProps) {
  return (
    <article className="group relative flex flex-col gap-2 py-6 md:grid md:grid-cols-[7.5rem_minmax(0,1fr)] md:gap-x-6">
      <p className="flex flex-wrap gap-x-2 font-mono text-meta text-fg-muted md:flex-col md:pt-0.75">
        <time dateTime={post.date}>{post.date}</time>
        {showCollection && (
          <span>
            <span aria-hidden="true" className="md:hidden">
              ·{' '}
            </span>
            {COLLECTIONS[post.collection].singular}
          </span>
        )}
      </p>
      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="text-section font-semibold tracking-[-0.01em] text-fg">
          <Link
            href={`/${post.collection}/${post.slug}`}
            className="transition-colors duration-150 group-hover:text-accent before:absolute before:inset-0 before:content-['']"
          >
            {post.title}
          </Link>
        </h2>
        <p className="text-sm text-fg-body">{post.description}</p>
        {post.tags.length > 0 && (
          <ul
            aria-label="Tags"
            className="relative mt-1 flex flex-wrap gap-x-2.5 gap-y-2"
          >
            {post.tags.map(tag => (
              <li key={tag}>
                <Tag tag={tag} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}
