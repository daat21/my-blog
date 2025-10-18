import TagFromNotion from './TagFromNotion'
import { listNotionTagOptions } from '@/lib/notion/notion-tags-list'

export default async function TagsListFromNotion() {
  const tags = await listNotionTagOptions()

  return (
    <div className="flex flex-wrap gap-2">
      {tags?.map(tag => (
        <TagFromNotion key={tag.id} name={tag.name} color={tag.color} />
      ))}
    </div>
  )
}
