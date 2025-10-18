import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getNotionPageRecordMap } from '@/lib/notion/notion'
import { getBlogPostMetadata } from '@/lib/notion/getBlogPostMetadata'
import { getPageIdBySlug, ALL_SLUGS } from '@/lib/notion/notionMapping'
import NotionContent from './notionContent'

export const revalidate = 60
export async function generateStaticParams() {
  return ALL_SLUGS.map(slug => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  return {
    title: params.slug.replace(/-/g, ' '),
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const pageId = getPageIdBySlug(params.slug)
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
