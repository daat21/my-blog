import type { MetadataRoute } from 'next'

import { getAlbum, listAlbums, listPosts } from '@/lib/content'
import { env } from '@/lib/env'

const SECTIONS = ['/', '/writing', '/photos', '/projects'] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Previews list drafts too; the sitemap only ever names published posts
  // and photos, and the tags the posts use.
  const [allPosts, allAlbums] = await Promise.all([listPosts(), listAlbums()])
  const posts = allPosts.filter(post => !post.draft)
  const albums = (
    await Promise.all(
      allAlbums.filter(album => !album.draft).map(album => getAlbum(album.slug))
    )
  )
    .filter(album => album !== null)
    .filter(album => album.photos.some(photo => !photo.draft))
  const tags = [...new Set(posts.flatMap(post => post.tags))].sort()

  return [
    ...SECTIONS.map(path => ({ url: `${env.siteUrl}${path}` })),
    ...posts.map(post => ({
      url: `${env.siteUrl}/writing/${post.slug}`,
      lastModified: post.updated ?? post.date,
    })),
    ...albums.flatMap(album => [
      {
        url: `${env.siteUrl}/photos/${album.slug}`,
        lastModified: album.endDate ?? album.date,
      },
      ...album.photos
        .filter(photo => !photo.draft)
        .map(photo => ({
          url: `${env.siteUrl}/photos/${album.slug}/${photo.slug}`,
          lastModified: photo.taken?.slice(0, 10) ?? album.date,
        })),
    ]),
    ...tags.map(tag => ({ url: `${env.siteUrl}/tags/${tag}` })),
  ]
}
