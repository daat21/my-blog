import type { Metadata } from 'next'

import { getPost, listPosts, listTags, type Collection } from '@/lib/content'

import { COLLECTIONS } from './collections'

/**
 * With Cache Components a dynamic route must prerender at least one path.
 * When there is nothing to list, this stand-in is prerendered instead, and
 * renders the not-found page like any unknown slug or tag.
 */
const NOTHING_YET = '_'

/** `generateStaticParams` for `/<collection>/[slug]`: every visible post. */
export async function articleStaticParams(
  collection: Collection
): Promise<{ slug: string }[]> {
  const posts = await listPosts({ collection })
  const slugs = posts.length > 0 ? posts.map(post => post.slug) : [NOTHING_YET]
  return slugs.map(slug => ({ slug }))
}

/** `generateStaticParams` for `/tags/[tag]`: every tag of a visible post. */
export async function tagStaticParams(): Promise<{ tag: string }[]> {
  const tags = await listTags()
  const names = tags.length > 0 ? tags.map(({ tag }) => tag) : [NOTHING_YET]
  return names.map(tag => ({ tag }))
}

/** Page title, description and Open Graph article data for a post. */
export async function articleMetadata(
  collection: Collection,
  slug: string
): Promise<Metadata> {
  const post = await getPost(collection, slug)
  if (!post) return {}
  const url = `/${collection}/${post.slug}`
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
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
