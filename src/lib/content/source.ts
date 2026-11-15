import type { Post, PostSummary, Profile, Project, TagCount } from './types'

export interface PostFilter {
  tag?: string
}

/**
 * Where content comes from. Pages and components never read content any
 * other way, so the storage behind it can change without touching them.
 * Implementations decide draft visibility from the environment.
 */
export interface ContentSource {
  /** Newest first. */
  listPosts(filter?: PostFilter): Promise<PostSummary[]>
  getPost(slug: string): Promise<Post | null>
  /** Most used first. */
  listTags(): Promise<TagCount[]>
  /** Sorted by `order`, then newest first. */
  listProjects(): Promise<Project[]>
  getProfile(): Promise<Profile>
}
