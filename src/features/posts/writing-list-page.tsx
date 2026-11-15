import { PAGE_GUTTER, READING_COLUMN } from '@/components/layout/page-gutter'
import { PageHeader } from '@/components/ui/page-header'
import { listPosts } from '@/lib/content'

import { PostList } from './post-list'
import { WRITING_INTRO } from './writing-intro'

/** Every post, newest first. */
export async function WritingListPage() {
  const posts = await listPosts()

  return (
    <div className={PAGE_GUTTER}>
      <div className={READING_COLUMN}>
        <PageHeader
          title={WRITING_INTRO.title}
          description={WRITING_INTRO.description}
        />
        <PostList posts={posts} />
      </div>
    </div>
  )
}
