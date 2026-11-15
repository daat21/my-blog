import type { Metadata } from 'next'

import { TagPostsPage, tagMetadata, tagStaticParams } from '@/features/posts'

interface TagPageProps {
  params: Promise<{ tag: string }>
}

// The whole page must be static. A tag that was not prerendered is rendered
// in full before the response starts, so an unknown one gets a real 404
// status instead of a streamed not-found page.
export const ensureStatic = 'navigation'

export function generateStaticParams() {
  return tagStaticParams()
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag } = await params
  return tagMetadata(tag)
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params
  return <TagPostsPage tag={tag} />
}
