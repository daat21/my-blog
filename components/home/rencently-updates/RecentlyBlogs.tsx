import { HorizontalCard } from '@/components/pages/Cards'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function RecentlyBlogs() {
  const supabase = await createClient()
  const { data: blogs, error } = await supabase
    .from('posts')
    .select('*')
    .order('published_at', { ascending: false })

  if (error) {
    console.error(error)
  }

  const recentlyBlogs = blogs?.slice(0, 3)

  return (
    <div className="min-h-[486px] flex-col rounded-lg border p-4 md:flex md:p-8">
      <Link href="/blogs">
        <h2 className="cursor-pointer border-0 text-center text-xl md:mb-4 md:text-2xl">
          Recently Updated
        </h2>
      </Link>
      <div className="flex flex-col gap-8">
        {recentlyBlogs?.map(blog => (
          <HorizontalCard key={blog.id} blog={blog} />
        ))}
      </div>
    </div>
  )
}
