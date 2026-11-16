import type { Metadata } from 'next'

import {
  getAlbum,
  getPhoto,
  getProfile,
  listAlbums,
  staticParams,
} from '@/lib/content'

import { PHOTOS_INTRO } from './photos-intro'
import { widestWebp } from './widest-webp'

/** Static album segments, including the shared empty-collection fallback. */
export async function albumStaticParams() {
  return staticParams(
    'album',
    (await listAlbums()).map(album => album.slug)
  )
}

/** Static photo segments for each visible album. */
export async function photoStaticParams() {
  const albums = await albumStaticParams()
  return (
    await Promise.all(
      albums.map(async ({ album }) => {
        const entry = await getAlbum(album)
        return staticParams(
          'photo',
          entry?.photos.map(photo => photo.slug) ?? []
        ).map(params => ({ album, ...params }))
      })
    )
  ).flat()
}

/** Metadata for the album index. */
export const galleryMetadata: Metadata = {
  title: PHOTOS_INTRO.title,
  description: PHOTOS_INTRO.description,
  alternates: { canonical: '/photos' },
}

/** An album's preview uses its selected visible cover. */
export async function albumMetadata(slug: string): Promise<Metadata> {
  const [album, profile] = await Promise.all([getAlbum(slug), getProfile()])
  if (!album) return {}
  const url = `/photos/${slug}`
  const image = widestWebp(album.cover.image)
  return {
    title: album.title,
    description: album.description,
    alternates: { canonical: url },
    openGraph: {
      siteName: profile.name,
      locale: 'en',
      type: 'article',
      url,
      title: album.title,
      description: album.description,
      publishedTime: album.date,
      ...(image && {
        images: [{ ...image, alt: album.cover.alt, type: 'image/webp' }],
      }),
    },
  }
}

/** A photo's preview is its widest processed WebP variant. */
export async function photoMetadata(
  album: string,
  slug: string
): Promise<Metadata> {
  const [photo, profile] = await Promise.all([
    getPhoto(album, slug),
    getProfile(),
  ])
  if (!photo) return {}
  const url = `/photos/${album}/${slug}`
  const image = widestWebp(photo.image)
  return {
    title: photo.title,
    description: photo.description,
    alternates: { canonical: url },
    openGraph: {
      siteName: profile.name,
      locale: 'en',
      type: 'article',
      url,
      title: photo.title,
      description: photo.description,
      ...(photo.taken && { publishedTime: photo.taken.replace(' ', 'T') }),
      ...(image && {
        images: [{ ...image, alt: photo.alt, type: 'image/webp' }],
      }),
    },
  }
}
