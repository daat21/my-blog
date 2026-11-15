import { notFound } from 'next/navigation'

import { PAGE_GUTTER, READING_COLUMN } from '@/components/layout/page-gutter'
import { PageHeader } from '@/components/ui/page-header'
import { listPosts } from '@/lib/content'

import { PostList } from './post-list'

interface TagPostsPageProps {
  tag: string
}

/** Posts with one tag, newest first. Unknown tags are a 404. */
export async function TagPostsPage({ tag }: TagPostsPageProps) {
  const posts = await listPosts({ tag })
  if (posts.length === 0) notFound()

  const count = posts.length === 1 ? '1 post' : `${posts.length} posts`

  return (
    <div className={PAGE_GUTTER}>
      <div className={READING_COLUMN}>
        <PageHeader
          title={
            <>
              <span className="font-normal text-fg-muted">#</span>
              {tag}
            </>
          }
          description={`${count} tagged “${tag}”, newest first.`}
        />
        <PostList posts={posts} />
      </div>
    </div>
  )
}
