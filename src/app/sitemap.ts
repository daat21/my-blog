import type { MetadataRoute } from 'next'

import { listPhotos, listPosts } from '@/lib/content'
import { env } from '@/lib/env'

const SECTIONS = ['/', '/writing', '/photos', '/projects'] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Previews list drafts too; the sitemap only ever names published posts
  // and photos, and the tags the posts use.
  const [allPosts, allPhotos] = await Promise.all([listPosts(), listPhotos()])
  const posts = allPosts.filter(post => !post.draft)
  const photos = allPhotos.filter(photo => !photo.draft)
  const tags = [...new Set(posts.flatMap(post => post.tags))].sort()

  return [
    ...SECTIONS.map(path => ({ url: `${env.siteUrl}${path}` })),
    ...posts.map(post => ({
      url: `${env.siteUrl}/writing/${post.slug}`,
      lastModified: post.updated ?? post.date,
    })),
    ...photos.map(photo => ({
      url: `${env.siteUrl}/photos/${photo.slug}`,
      lastModified: photo.date,
    })),
    ...tags.map(tag => ({ url: `${env.siteUrl}/tags/${tag}` })),
  ]
}
