import { notFound } from 'next/navigation'

import { PAGE_GUTTER, READING_COLUMN } from '@/components/layout/page-gutter'
import { SiteFooter } from '@/components/layout/site-footer'
import { TableOfContents } from '@/components/layout/table-of-contents'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { getPost, listPosts } from '@/lib/content'
import { findNeighbours } from '@/lib/utils'

import { ArticleBody } from './article-body'
import { ArticleFooter } from './article-footer'
import { ArticleHeader } from './article-header'

interface ArticlePageProps {
  slug: string
}

/**
 * A post. Below the full tier the table of contents is a
 * collapsible block above the body; from 1280px it is a sticky right rail.
 * Unknown slugs, and drafts where drafts are hidden, are a 404.
 */
export async function ArticlePage({ slug }: ArticlePageProps) {
  const [post, posts] = await Promise.all([getPost(slug), listPosts()])
  if (!post) notFound()

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_13.125rem]">
      <div className={PAGE_GUTTER}>
        <div className={READING_COLUMN}>
          <article>
            <Breadcrumb
              items={[
                { label: 'writing', href: '/writing' },
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
          <SiteFooter />
        </div>
      </div>
      <TableOfContents
        headings={post.headings}
        variant="rail"
        className="hidden self-start xl:block"
      />
    </div>
  )
}
