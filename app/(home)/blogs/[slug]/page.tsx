import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getNotionPageRecordMap } from '@/lib/notion/notion'
import { getBlogPostMetadata } from '@/lib/notion/getBlogPostMetadata'
import {
  getAllPublishedBlogSlugs,
  getPageIdBySlug,
} from '@/lib/notion/notionMapping'
import NotionContent from './notionContent'
import BlogPostSkeleton from '@/components/blogs/BlogPostSkeleton'

export const revalidate = 60
export async function generateStaticParams() {
  const slugs = await getAllPublishedBlogSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const { slug } = params
  const pageId = await getPageIdBySlug(slug)
  if (!pageId) return {}

  const post = await getBlogPostMetadata(pageId)
  if (!post) return {}

  const description = post.description || undefined
  const coverImage = post.cover_image_url || undefined

  return {
    title: post.title,
    ...(description ? { description } : {}),
    openGraph: {
      title: post.title,
      ...(description ? { description } : {}),
      ...(coverImage
        ? {
            images: [
              {
                url: coverImage,
                width: 1200,
                height: 630,
                alt: post.title,
              },
            ],
          }
        : {}),
    },
  }
}

type BlogPostMetadata = NonNullable<
  Awaited<ReturnType<typeof getBlogPostMetadata>>
>

type RecordMapPromise = ReturnType<typeof getNotionPageRecordMap>

async function NotionArticleContent({
  recordMapPromise,
  metadata,
}: {
  recordMapPromise: RecordMapPromise
  metadata: BlogPostMetadata
}) {
  const recordMap = await recordMapPromise
  return <NotionContent recordMap={recordMap} metadata={metadata} />
}

export default async function Page({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params
  const pageId = await getPageIdBySlug(slug)
  if (!pageId) return notFound()

  const recordMapPromise = getNotionPageRecordMap(pageId)
  const metadata = await getBlogPostMetadata(pageId)

  if (!metadata) return notFound()
  return (
    <main className="mx-auto w-full max-w-screen-xl px-0 py-8 sm:px-4">
      <Suspense fallback={<BlogPostSkeleton />}>
        <NotionArticleContent
          recordMapPromise={recordMapPromise}
          metadata={metadata}
        />
      </Suspense>
    </main>
  )
}
