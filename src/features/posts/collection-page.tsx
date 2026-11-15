import { listPosts, type Collection } from '@/lib/content'

import { COLLECTIONS } from './collections'
import { ListHeader } from './list-header'
import { PAGE_GUTTER, READING_COLUMN } from './page-gutter'
import { PostList } from './post-list'

interface CollectionPageProps {
  collection: Collection
}

/** Every post in one collection, newest first. */
export async function CollectionPage({ collection }: CollectionPageProps) {
  const posts = await listPosts({ collection })
  const { title, description } = COLLECTIONS[collection]

  return (
    <div className={PAGE_GUTTER}>
      <div className={READING_COLUMN}>
        <ListHeader title={title} description={description} />
        <PostList posts={posts} />
      </div>
    </div>
  )
}
