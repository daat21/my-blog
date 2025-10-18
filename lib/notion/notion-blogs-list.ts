import 'server-only'
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY! })
const BLOG_DB_ID = process.env.NOTION_BLOG_DATABASE_ID!

export type BlogListItem = {
  id: string
  title: string
  slug: string
  created_time: string
  date: string
  last_edited_time: string
  tags: { id: string; name: string; color: string }[]
  description: string
  cover_image_url: string
}

export async function listBlogPosts(limit = 20): Promise<BlogListItem[]> {
  const res = await notion.dataSources.query({
    data_source_id: BLOG_DB_ID,
    filter: { and: [{ property: 'Published', checkbox: { equals: true } }] },
    sorts: [{ property: 'Date', direction: 'descending' }],
    page_size: limit,
    result_type: 'page',
  })

  return res.results.map((page: any) => ({
    id: page.id,
    title: page.properties.Title?.rich_text?.[0]?.plain_text ?? 'Untitled',
    slug: page.properties.Slug?.rich_text?.[0]?.plain_text ?? page.id,
    date: page.properties.Date?.date?.start ?? '',
    created_time: page.created_time,
    last_edited_time: page.last_edited_time,
    tags:
      (page.properties.Tags?.multi_select ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        color: t.color,
      })) ?? [],
    description: page.properties.Description?.rich_text?.[0]?.plain_text ?? '',
    cover_image_url: page.properties.Cover?.url ?? '',
  }))
}
