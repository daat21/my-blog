import type { Metadata } from 'next'

import {
  getPost,
  getProfile,
  listPosts,
  listTags,
  staticParams,
  type Collection,
} from '@/lib/content'

import { COLLECTIONS } from './collections'

/**
 * `generateStaticParams` for `/<collection>/[slug]`: every visible post, or
 * the shared placeholder when there are none (which renders a 404).
 */
export async function articleStaticParams(
  collection: Collection
): Promise<{ slug: string }[]> {
  const posts = await listPosts({ collection })
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
export async function articleMetadata(
  collection: Collection,
  slug: string
): Promise<Metadata> {
  const [post, profile] = await Promise.all([
    getPost(collection, slug),
    getProfile(),
  ])
  if (!post) return {}
  const url = `/${collection}/${post.slug}`
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

/** Metadata for the list of one collection. */
export function collectionMetadata(collection: Collection): Metadata {
  const { title, description } = COLLECTIONS[collection]
  return {
    title,
    description,
    alternates: { canonical: `/${collection}` },
  }
}

/** Metadata for the posts with one tag. */
export function tagMetadata(tag: string): Metadata {
  return {
    title: `Tagged “${tag}”`,
    description: `Writing and notes tagged “${tag}”.`,
    alternates: { canonical: `/tags/${tag}` },
  }
}
