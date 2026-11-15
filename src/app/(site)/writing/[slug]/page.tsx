import type { Metadata } from 'next'

import {
  ArticlePage,
  articleMetadata,
  articleStaticParams,
} from '@/features/posts'

interface WritingArticleProps {
  params: Promise<{ slug: string }>
}

// The whole page must be static. A slug that was not prerendered is
// rendered in full before the response starts, so an unknown one gets a real
// 404 status instead of a streamed not-found page.
export const ensureStatic = 'navigation'

export function generateStaticParams() {
  return articleStaticParams('writing')
}

export async function generateMetadata({
  params,
}: WritingArticleProps): Promise<Metadata> {
  const { slug } = await params
  return articleMetadata('writing', slug)
}

export default async function WritingArticlePage({
  params,
}: WritingArticleProps) {
  const { slug } = await params
  return <ArticlePage collection="writing" slug={slug} />
}
