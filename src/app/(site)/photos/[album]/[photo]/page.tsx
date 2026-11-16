import type { Metadata } from 'next'

import { PhotoPage, photoMetadata, photoStaticParams } from '@/features/photos'

interface PhotoRouteProps {
  params: Promise<{ album: string; photo: string }>
}

export const ensureStatic = 'navigation'

export function generateStaticParams() {
  return photoStaticParams()
}

export async function generateMetadata({
  params,
}: PhotoRouteProps): Promise<Metadata> {
  const { album, photo } = await params
  return photoMetadata(album, photo)
}

export default async function PhotoRoute({ params }: PhotoRouteProps) {
  const { album, photo } = await params
  return <PhotoPage album={album} slug={photo} />
}
