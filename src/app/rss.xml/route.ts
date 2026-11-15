import { getProfile, listPosts } from '@/lib/content'
import { env } from '@/lib/env'
import { renderRss } from '@/lib/feed/rss'

// Reads only cached content and nothing from the request, so the feed is
// prerendered at build time like the pages.
export async function GET(): Promise<Response> {
  const [profile, allPosts] = await Promise.all([getProfile(), listPosts()])
  // Previews list drafts too; the feed only ever carries published posts.
  const posts = allPosts.filter(post => !post.draft)
  // ISO dates sort as text, so the last one is the latest change.
  const lastBuildDate = posts
    .map(post => post.updated ?? post.date)
    .sort()
    .at(-1)

  const xml = renderRss(
    {
      title: profile.name,
      link: env.siteUrl,
      description: profile.bio,
      feedUrl: `${env.siteUrl}/rss.xml`,
      language: 'en',
      lastBuildDate,
    },
    posts.map(post => ({
      title: post.title,
      link: `${env.siteUrl}/${post.collection}/${post.slug}`,
      description: post.description,
      date: post.date,
      categories: post.tags,
    }))
  )

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
