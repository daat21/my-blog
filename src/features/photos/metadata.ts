import type { Metadata } from 'next'

import { getPhoto, getProfile, listPhotos, staticParams } from '@/lib/content'

import { PHOTOS_INTRO } from './photos-intro'
import { widestWebp } from './widest-webp'

/**
 * `generateStaticParams` for `/photos/[slug]`: every visible photo, or the
 * shared placeholder when there are none (which renders a 404).
 */
export async function photoStaticParams(): Promise<{ slug: string }[]> {
  const photos = await listPhotos()
  return staticParams(
    'slug',
    photos.map(photo => photo.slug)
  )
}

/** Metadata for the gallery. */
export const galleryMetadata: Metadata = {
  title: PHOTOS_INTRO.title,
  description: PHOTOS_INTRO.description,
  alternates: { canonical: '/photos' },
}

/**
 * Page title, description and Open Graph data for a photo. The preview
 * image is the photo itself, its widest WebP variant; metadataBase makes
 * the URL absolute.
 */
export async function photoMetadata(slug: string): Promise<Metadata> {
  const [photo, profile] = await Promise.all([getPhoto(slug), getProfile()])
  if (!photo) return {}
  const url = `/photos/${photo.slug}`
  const image = widestWebp(photo.image)
  return {
    title: photo.title,
    description: photo.description,
    alternates: { canonical: url },
    // A page's openGraph replaces the root layout's object entirely, so the
    // site-wide fields are repeated here.
    openGraph: {
      siteName: profile.name,
      locale: 'en',
      type: 'article',
      url,
      title: photo.title,
      description: photo.description,
      publishedTime: photo.date,
      ...(image && {
        images: [{ ...image, alt: photo.alt, type: 'image/webp' }],
      }),
    },
  }
}
