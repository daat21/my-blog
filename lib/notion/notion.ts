import 'server-only'
import { NotionAPI } from 'notion-client'

const notion = new NotionAPI(
  process.env.NOTION_TOKEN ? { authToken: process.env.NOTION_TOKEN } : undefined
)

export async function getNotionPageRecordMap(pageId: string) {
  const recordMap = await notion.getPage(pageId)
  return recordMap
}
