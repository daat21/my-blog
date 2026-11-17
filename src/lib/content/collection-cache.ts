import { cacheLife, cacheTag } from 'next/cache'

import { selectContent } from '@/lib/content/runtime-source'

/** Shares visible post membership and tag counts across every item/filter cache key. */
export async function readPosts() {
  'use cache'
  const { source, degraded } = await selectContent()
  if (degraded) cacheLife({ stale: 30, revalidate: 30, expire: 300 })
  else cacheLife('max')
  cacheTag('posts')
  const posts = await source.listPosts()
  const counts = new Map<string, number>()
  for (const post of posts)
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  const tags = [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort(
      (a, b) =>
        b.count - a.count || (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0)
    )
  return { posts, tags, degraded }
}

/** Shares visible album/photo membership without a separate source selection for each missing URL. */
export async function readAlbums() {
  'use cache'
  const { source, degraded } = await selectContent()
  if (degraded) cacheLife({ stale: 30, revalidate: 30, expire: 300 })
  else cacheLife('max')
  cacheTag('albums')
  const albums = await source.listAlbums()
  const photos: Record<string, string[]> = Object.fromEntries(
    await Promise.all(
      albums.map(
        async album =>
          [
            album.slug,
            (await source.getAlbum(album.slug))?.photos.map(
              photo => photo.slug
            ) ?? [],
          ] as const
      )
    )
  )
  return { albums, photos, degraded }
}
