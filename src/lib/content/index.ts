import { cacheLife, cacheTag } from 'next/cache'

import { createFileSystemSource } from '@/lib/content/file-system-source'
import type { PostFilter } from '@/lib/content/source'
import type {
  Collection,
  Post,
  PostSummary,
  Profile,
  Project,
  TagCount,
} from '@/lib/content/types'
import { env } from '@/lib/env'
import { getMediaResolver, type MediaResolver } from '@/lib/media'

export type * from '@/lib/content/types'
export type { ContentSource, PostFilter } from '@/lib/content/source'
export { PLACEHOLDER_PARAM, staticParams } from '@/lib/content/static-params'

let mediaResolver: MediaResolver | undefined

// Looked up on first use, so lists, tags and the profile never depend on
// media being available.
const media: MediaResolver = {
  resolve: ref => (mediaResolver ??= getMediaResolver()).resolve(ref),
}

const source = createFileSystemSource({
  contentDir: env.contentDir,
  showDrafts: env.showDrafts,
  media,
})

// Every read is cached for as long as possible and tagged, so publishing can
// later invalidate exactly what changed: `posts` covers every list of posts
// (and the tag counts derived from them), `post:<collection>:<slug>` one post.

/** Posts from both collections, or from one, newest first. */
export async function listPosts(filter?: PostFilter): Promise<PostSummary[]> {
  'use cache'
  cacheLife('max')
  cacheTag('posts')
  return await source.listPosts(filter)
}

/** One rendered post, or null if it does not exist or is a hidden draft. */
export async function getPost(
  collection: Collection,
  slug: string
): Promise<Post | null> {
  'use cache'
  cacheLife('max')
  cacheTag(`post:${collection}:${slug}`)
  return await source.getPost(collection, slug)
}

/** Tags of visible posts with their counts, most used first. */
export async function listTags(): Promise<TagCount[]> {
  'use cache'
  cacheLife('max')
  cacheTag('tags', 'posts')
  return await source.listTags()
}

/** All projects, sorted by `order` and then newest first. */
export async function listProjects(): Promise<Project[]> {
  'use cache'
  cacheLife('max')
  cacheTag('projects')
  return await source.listProjects()
}

/** The profile shown on the home page and in the sidebar. */
export async function getProfile(): Promise<Profile> {
  'use cache'
  cacheLife('max')
  cacheTag('profile')
  return await source.getProfile()
}
