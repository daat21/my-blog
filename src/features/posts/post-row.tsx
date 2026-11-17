import Link from 'next/link'

import { MediaImage } from '@/components/ui/media-image'
import { Tag } from '@/components/ui/tag'
import type { PostSummary } from '@/lib/content'

interface PostRowProps {
  post: Pick<
    PostSummary,
    'slug' | 'title' | 'description' | 'date' | 'tags' | 'cover'
  >
  loading?: 'eager' | 'lazy'
}

/**
 * One post in a list, with an optional right-hand cover. The title link
 * covers the whole row, and the tag links sit above it.
 */
export function PostRow({ post, loading = 'lazy' }: PostRowProps) {
  return (
    <article className="group relative flex items-start gap-4 py-6 md:gap-6">
      <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-[7.5rem_minmax(0,1fr)] md:gap-x-6">
        <p className="font-mono text-meta text-fg-muted md:pt-0.75">
          <time dateTime={post.date}>{post.date}</time>
        </p>
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="text-section font-semibold tracking-[-0.01em] text-fg">
            <Link
              href={`/writing/${post.slug}`}
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
      </div>
      {post.cover && (
        <div className="pointer-events-none relative aspect-4/3 w-20 shrink-0 overflow-hidden rounded-md bg-sunken md:w-28">
          <MediaImage
            image={post.cover.image}
            alt={post.cover.alt}
            sizes="(min-width: 768px) 112px, 80px"
            loading={loading}
            className="absolute inset-0 size-full object-cover"
          />
        </div>
      )}
    </article>
  )
}
