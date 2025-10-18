import 'server-only'
import { Client } from '@notionhq/client'
import { cache } from 'react'
import type { BlogListItem } from './notion-blogs-list'

const notion = new Client({ auth: process.env.NOTION_API_KEY! })

export const getBlogPostMetadata = cache(
  async (pageId: string): Promise<BlogListItem | null> => {
    const page = await notion.pages
      .retrieve({ page_id: pageId })
      .catch(() => null)

    if (!page || !('properties' in page)) {
      return null
    }

    const properties = page.properties as Record<string, any>
    // const cover =
    //   page.cover && 'type' in page.cover ? page.cover[page.cover.type] : null

    return {
      id: page.id,
      title:
        properties.Title?.title?.[0]?.plain_text ??
        properties.Title?.rich_text?.[0]?.plain_text ??
        'Untitled',
      slug:
        properties.Slug?.rich_text?.[0]?.plain_text ??
        properties.Slug?.title?.[0]?.plain_text ??
        page.id,
      date: properties.Date?.date?.start ?? '',
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
      tags:
        (properties.Tags?.multi_select ?? []).map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
        })) ?? [],
      description:
        properties.Description?.rich_text?.[0]?.plain_text ??
        properties.Description?.title?.[0]?.plain_text ??
        '',
      cover_image_url: properties.Cover?.url ?? '',
    }
  }
)
