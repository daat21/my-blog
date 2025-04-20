import { BlogCard } from '@/components/pages/Cards'
import { createClient } from '@/lib/supabase/server'
import { Blog } from '@/types'

export default async function BlogsList() {
  const supabase = await createClient()

  const { data: blogs, error } = await supabase.from('posts').select(`
      *,
      post_tags(
        tag_id,
        tags:tag_id(*)
      )
    `)

  if (error) {
    console.error(error)
  }

  const processedBlogs = blogs?.map(blog => {
    const tags = blog.post_tags?.map((pt: any) => pt.tags) || []

    return {
      ...blog,
      tags,
      post_tags: undefined,
    }
  }) as Blog[]

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-10">
      {processedBlogs?.map(blog => <BlogCard key={blog.id} blog={blog} />)}
    </div>
  )
}
