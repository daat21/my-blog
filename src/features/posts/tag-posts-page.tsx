import { notFound } from 'next/navigation'

import {
  PAGE_COLUMN,
  PAGE_FRAME,
  READING_COLUMN,
} from '@/components/layout/page-gutter'
import { SiteFooter } from '@/components/layout/site-footer'
import { PageHeader } from '@/components/ui/page-header'
import { listPosts } from '@/lib/content'
import { cn, formatCount } from '@/lib/utils'

import { PostList } from './post-list'

interface TagPostsPageProps {
  tag: string
}

/** Posts with one tag, newest first. Unknown tags are a 404. */
export async function TagPostsPage({ tag }: TagPostsPageProps) {
  const posts = await listPosts({ tag })
  if (posts.length === 0) notFound()

  const count = formatCount(posts.length, 'post')

  return (
    <div className={PAGE_FRAME}>
      <div className={cn(READING_COLUMN, PAGE_COLUMN)}>
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
        <SiteFooter />
      </div>
    </div>
  )
}
