import 'server-only'

export type NotionTagOption = {
  id: string
  name: string
  color: string
}

const BLOG_DB_ID = process.env.NOTION_BLOG_DATABASE_ID_FROM_URL!
const NOTION_API_KEY = process.env.NOTION_API_KEY!

export async function listNotionTagOptions(): Promise<NotionTagOption[]> {
  const res = await fetch(`https://api.notion.com/v1/databases/${BLOG_DB_ID}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    // Cache for an hour to avoid hitting rate limits unnecessarily
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    console.error('Failed to fetch Notion tags', await res.text())
    return []
  }

  const data = (await res.json()) as any
  const options = data?.properties?.Tags?.multi_select?.options ?? []
  return options.map((opt: any) => ({
    id: opt.id,
    name: opt.name,
    color: opt.color,
  }))
}
