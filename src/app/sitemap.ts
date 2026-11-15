import type { MetadataRoute } from 'next'

import { listPosts } from '@/lib/content'
import { env } from '@/lib/env'

const SECTIONS = ['/', '/writing', '/projects'] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Previews list drafts too; the sitemap only ever names published posts
  // and the tags they use.
  const posts = (await listPosts()).filter(post => !post.draft)
  const tags = [...new Set(posts.flatMap(post => post.tags))].sort()

  return [
    ...SECTIONS.map(path => ({ url: `${env.siteUrl}${path}` })),
    ...posts.map(post => ({
      url: `${env.siteUrl}/writing/${post.slug}`,
      lastModified: post.updated ?? post.date,
    })),
    ...tags.map(tag => ({ url: `${env.siteUrl}/tags/${tag}` })),
  ]
}
