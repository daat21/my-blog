import {
  PAGE_COLUMN,
  PAGE_FRAME,
  READING_COLUMN,
} from '@/components/layout/page-gutter'
import { SiteFooter } from '@/components/layout/site-footer'
import { PageHeader } from '@/components/ui/page-header'
import { listPosts } from '@/lib/content'
import { cn } from '@/lib/utils'

import { PostList } from './post-list'
import { WRITING_INTRO } from './writing-intro'

/** Every post, newest first. */
export async function WritingListPage() {
  const posts = await listPosts()

  return (
    <div className={PAGE_FRAME}>
      <div className={cn(READING_COLUMN, PAGE_COLUMN)}>
        <PageHeader
          title={WRITING_INTRO.title}
          description={WRITING_INTRO.description}
        />
        <PostList posts={posts} />
        <SiteFooter />
      </div>
    </div>
  )
}
