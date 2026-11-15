import { notFound } from 'next/navigation'

import { TableOfContents } from '@/components/layout/table-of-contents'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { getPost, listPosts, type Collection } from '@/lib/content'

import { ArticleBody } from './article-body'
import { ArticleFooter } from './article-footer'
import { ArticleHeader } from './article-header'
import { findNeighbours } from './neighbours'
import { PAGE_GUTTER, READING_COLUMN } from './page-gutter'

interface ArticlePageProps {
  collection: Collection
  slug: string
}

/**
 * A post or note. Below the full tier the table of contents is a
 * collapsible block above the body; from 1280px it is a sticky right rail.
 * Unknown slugs, and drafts where drafts are hidden, are a 404.
 */
export async function ArticlePage({ collection, slug }: ArticlePageProps) {
  const [post, posts] = await Promise.all([
    getPost(collection, slug),
    listPosts({ collection }),
  ])
  if (!post) notFound()

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_13.125rem]">
      <div className={PAGE_GUTTER}>
        <article className={READING_COLUMN}>
          <Breadcrumb
            items={[
              { label: collection, href: `/${collection}` },
              { label: post.date.slice(0, 4) },
              { label: post.slug },
            ]}
          />
          <ArticleHeader post={post} />
          <TableOfContents
            headings={post.headings}
            variant="collapsible"
            className="mb-10 xl:hidden"
          />
          <ArticleBody body={post.body} />
          <ArticleFooter neighbours={findNeighbours(posts, post.slug)} />
        </article>
      </div>
      <TableOfContents
        headings={post.headings}
        variant="rail"
        className="hidden self-start xl:block"
      />
    </div>
  )
}
