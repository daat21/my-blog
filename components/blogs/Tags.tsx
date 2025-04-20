import Tag from './Tag'
import { createClient } from '@/lib/supabase/server'

export default async function Tags() {
  const supabase = await createClient()
  const { data: tags, error } = await supabase.from('tags').select('*')

  if (error) {
    console.error(error)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags?.map(tag => <Tag key={tag.id} name={tag.name} color={tag.color} />)}
    </div>
  )
}
