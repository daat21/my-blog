import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getNotionPageRecordMap } from '@/lib/notion/notion'
import { getBlogPostMetadata } from '@/lib/notion/getBlogPostMetadata'
import {
  getAllPublishedBlogSlugs,
  getPageIdBySlug,
} from '@/lib/notion/notionMapping'
import NotionContent from './notionContent'

export const revalidate = 60
export async function generateStaticParams() {
  const slugs = await getAllPublishedBlogSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return {
    title: slug.replace(/-/g, ' '),
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const pageId = await getPageIdBySlug(slug)
  if (!pageId) return notFound()

  const [recordMap, metadata] = await Promise.all([
    getNotionPageRecordMap(pageId),
    getBlogPostMetadata(pageId),
  ])

  if (!metadata) return notFound()
  return (
    <main className="container mx-auto px-4 py-8">
      <NotionContent recordMap={recordMap} metadata={metadata} />
    </main>
  )
}
