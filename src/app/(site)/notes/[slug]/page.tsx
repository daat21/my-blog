import type { Metadata } from 'next'

import {
  ArticlePage,
  articleMetadata,
  articleStaticParams,
} from '@/features/posts'

interface NoteArticleProps {
  params: Promise<{ slug: string }>
}

// The whole page must be static. A slug that was not prerendered is
// rendered in full before the response starts, so an unknown one gets a real
// 404 status instead of a streamed not-found page.
export const ensureStatic = 'navigation'

export function generateStaticParams() {
  return articleStaticParams('notes')
}

export async function generateMetadata({
  params,
}: NoteArticleProps): Promise<Metadata> {
  const { slug } = await params
  return articleMetadata('notes', slug)
}

export default async function NoteArticlePage({ params }: NoteArticleProps) {
  const { slug } = await params
  return <ArticlePage collection="notes" slug={slug} />
}
