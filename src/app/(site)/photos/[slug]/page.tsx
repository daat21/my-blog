import type { Metadata } from 'next'

import { PhotoPage, photoMetadata, photoStaticParams } from '@/features/photos'

interface PhotoRouteProps {
  params: Promise<{ slug: string }>
}

// The whole page must be static. A slug that was not prerendered is
// rendered in full before the response starts, so an unknown one gets a real
// 404 status instead of a streamed not-found page.
export const ensureStatic = 'navigation'

export function generateStaticParams() {
  return photoStaticParams()
}

export async function generateMetadata({
  params,
}: PhotoRouteProps): Promise<Metadata> {
  const { slug } = await params
  return photoMetadata(slug)
}

export default async function PhotoRoute({ params }: PhotoRouteProps) {
  const { slug } = await params
  return <PhotoPage slug={slug} />
}
