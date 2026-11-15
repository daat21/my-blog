import type { Metadata } from 'next'

import {
  getPost,
  getProfile,
  listPosts,
  listTags,
  staticParams,
} from '@/lib/content'

import { WRITING_INTRO } from './writing-intro'

/**
 * `generateStaticParams` for `/writing/[slug]`: every visible post, or the
 * shared placeholder when there are none (which renders a 404).
 */
export async function articleStaticParams(): Promise<{ slug: string }[]> {
  const posts = await listPosts()
  return staticParams(
    'slug',
    posts.map(post => post.slug)
  )
}

/** `generateStaticParams` for `/tags/[tag]`: every tag of a visible post. */
export async function tagStaticParams(): Promise<{ tag: string }[]> {
  const tags = await listTags()
  return staticParams(
    'tag',
    tags.map(({ tag }) => tag)
  )
}

/** Page title, description and Open Graph article data for a post. */
export async function articleMetadata(slug: string): Promise<Metadata> {
  const [post, profile] = await Promise.all([getPost(slug), getProfile()])
  if (!post) return {}
  const url = `/writing/${post.slug}`
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    // A page's openGraph replaces the root layout's object entirely, so the
    // site-wide fields are repeated here.
    openGraph: {
      siteName: profile.name,
      locale: 'en',
      type: 'article',
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated,
      tags: post.tags,
    },
  }
}

/** Metadata for the writing list. */
export const writingMetadata: Metadata = {
  title: WRITING_INTRO.title,
  description: WRITING_INTRO.description,
  alternates: { canonical: '/writing' },
}

/** Metadata for the posts with one tag. */
export function tagMetadata(tag: string): Metadata {
  return {
    title: `Tagged “${tag}”`,
    description: `Writing tagged “${tag}”.`,
    alternates: { canonical: `/tags/${tag}` },
  }
}
