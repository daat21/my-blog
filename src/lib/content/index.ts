import { cacheLife, cacheTag } from 'next/cache'

import { readPosts, readAlbums } from '@/lib/content/collection-cache'
import { isSlug } from '@/lib/content/reader-source'
import { normalizeTag, photoSlugSchema } from '@/lib/content/schemas'
import { selectContent } from '@/lib/content/runtime-source'
import type { PostFilter } from '@/lib/content/source'
import type {
  Photo,
  Album,
  AlbumSummary,
  Post,
  PostSummary,
  Profile,
  Project,
  TagCount,
} from '@/lib/content/types'

export type * from '@/lib/content/types'
export type { ContentSource, PostFilter } from '@/lib/content/source'
export { PLACEHOLDER_PARAM, staticParams } from '@/lib/content/static-params'

// Every read is cached for as long as possible and tagged, so publishing can
// later invalidate exactly what changed: `posts` covers every list of posts
// (and their tag counts), `post:<slug>` one post, `albums` the index,
// `album:<album>` an album and `photo:<album>/<photo>` one photograph.

/** Every post, or those with a tag, newest first. */
export async function listPosts(filter?: PostFilter): Promise<PostSummary[]> {
  'use cache'
  const { posts, degraded } = await readPosts()
  if (degraded) cacheLife({ stale: 30, revalidate: 30, expire: 300 })
  else cacheLife('max')
  cacheTag('posts')
  const tag = filter?.tag === undefined ? undefined : normalizeTag(filter.tag)
  return tag === undefined
    ? posts
    : posts.filter(post => post.tags.includes(tag))
}

/** One rendered post, or null if it does not exist or is a hidden draft. */
export async function getPost(slug: string): Promise<Post | null> {
  'use cache'
  cacheTag(`post:${slug}`)
  const membership = await readPosts()
  if (!isSlug(slug) || !membership.posts.some(post => post.slug === slug)) {
    if (membership.degraded)
      cacheLife({ stale: 30, revalidate: 30, expire: 300 })
    else cacheLife('max')
    return null
  }
  const { source, degraded } = await selectContent()
  if (degraded) cacheLife({ stale: 30, revalidate: 30, expire: 300 })
  else cacheLife('max')
  return await source.getPost(slug)
}

/** Tags of visible posts with their counts, most used first. */
export async function listTags(): Promise<TagCount[]> {
  'use cache'
  const { tags, degraded } = await readPosts()
  if (degraded) cacheLife({ stale: 30, revalidate: 30, expire: 300 })
  else cacheLife('max')
  cacheTag('tags', 'posts')
  return tags
}

/** Every visible album, newest first. */
export async function listAlbums(): Promise<AlbumSummary[]> {
  'use cache'
  const { albums, degraded } = await readAlbums()
  if (degraded) cacheLife({ stale: 30, revalidate: 30, expire: 300 })
  else cacheLife('max')
  cacheTag('albums')
  return albums
}

/** An album with its ordered visible photographs and rendered intro. */
export async function getAlbum(album: string): Promise<Album | null> {
  'use cache'
  cacheTag(`album:${album}`)
  const membership = await readAlbums()
  if (
    !photoSlugSchema.safeParse(album).success ||
    !membership.albums.some(item => item.slug === album)
  ) {
    if (membership.degraded)
      cacheLife({ stale: 30, revalidate: 30, expire: 300 })
    else cacheLife('max')
    return null
  }
  const { source, degraded } = await selectContent()
  if (degraded) cacheLife({ stale: 30, revalidate: 30, expire: 300 })
  else cacheLife('max')
  return await source.getAlbum(album)
}

/** One photograph with its story and neighbours in the album. */
export async function getPhoto(
  album: string,
  photo: string
): Promise<Photo | null> {
  'use cache'
  cacheTag(`album:${album}`, `photo:${album}/${photo}`)
  const membership = await readAlbums()
  if (
    !photoSlugSchema.safeParse(album).success ||
    !photoSlugSchema.safeParse(photo).success ||
    !Object.hasOwn(membership.photos, album) ||
    !membership.photos[album]?.includes(photo)
  ) {
    if (membership.degraded)
      cacheLife({ stale: 30, revalidate: 30, expire: 300 })
    else cacheLife('max')
    return null
  }
  const { source, degraded } = await selectContent()
  if (degraded) cacheLife({ stale: 30, revalidate: 30, expire: 300 })
  else cacheLife('max')
  return await source.getPhoto(album, photo)
}

/** All projects, sorted by `order` and then newest first. */
export async function listProjects(): Promise<Project[]> {
  'use cache'
  const { source, degraded } = await selectContent()
  if (degraded) cacheLife({ stale: 30, revalidate: 30, expire: 300 })
  else cacheLife('max')
  cacheTag('projects')
  return await source.listProjects()
}

/** The profile shown on the home page and in the sidebar. */
export async function getProfile(): Promise<Profile> {
  'use cache'
  const { source, degraded } = await selectContent()
  if (degraded) cacheLife({ stale: 30, revalidate: 30, expire: 300 })
  else cacheLife('max')
  cacheTag('profile')
  return await source.getProfile()
}
