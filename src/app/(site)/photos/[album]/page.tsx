import type { Metadata } from 'next'

import { AlbumPage, albumMetadata, albumStaticParams } from '@/features/photos'

interface AlbumRouteProps {
  params: Promise<{ album: string }>
}

export const ensureStatic = 'navigation'

export function generateStaticParams() {
  return albumStaticParams()
}

export async function generateMetadata({
  params,
}: AlbumRouteProps): Promise<Metadata> {
  return albumMetadata((await params).album)
}

export default async function AlbumRoute({ params }: AlbumRouteProps) {
  return <AlbumPage slug={(await params).album} />
}
