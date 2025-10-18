import 'server-only'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY! })
const BLOG_DB_ID = process.env.NOTION_BLOG_DATABASE_ID!

function extractSlug(page: any): string | null {
  const slug =
    page.properties?.Slug?.rich_text?.[0]?.plain_text ??
    page.properties?.Slug?.title?.[0]?.plain_text ??
    null
  return slug && slug.trim().length > 0 ? slug.trim() : null
}

export async function getAllPublishedBlogSlugs(): Promise<string[]> {
  const slugs = new Set<string>()
  let cursor: string | undefined

  do {
    const res = await notion.dataSources
      .query({
        data_source_id: BLOG_DB_ID,
        filter: {
          and: [
            { property: 'Published', checkbox: { equals: true } },
            { property: 'Slug', rich_text: { is_not_empty: true } },
          ],
        },
        page_size: 100,
        start_cursor: cursor,
        result_type: 'page',
      })
      .catch(() => null)

    if (!res) break

    for (const page of res.results as any[]) {
      const slug = extractSlug(page)
      if (slug) slugs.add(slug)
    }

    cursor = res.has_more ? res.next_cursor ?? undefined : undefined
  } while (cursor)

  return Array.from(slugs).sort()
}

export async function getPageIdBySlug(
  slug: string
): Promise<string | undefined> {
  const res = await notion.dataSources
    .query({
      data_source_id: BLOG_DB_ID,
      filter: {
        and: [
          { property: 'Published', checkbox: { equals: true } },
          { property: 'Slug', rich_text: { equals: slug } },
        ],
      },
      page_size: 1,
      result_type: 'page',
    })
    .catch(() => null)

  if (!res || res.results.length === 0) return undefined

  const page = res.results[0] as any
  return page?.id
}
