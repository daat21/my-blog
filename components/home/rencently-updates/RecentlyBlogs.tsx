import { HorizontalCard } from '@/components/pages/Cards'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function RecentlyBlogs() {
  const supabase = await createClient()
  const { data: blogs, error } = await supabase
    .from('posts')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error(error)
  }

  const recentlyBlogs = blogs?.slice(0, 3)

  return (
    <div className="flex min-h-[486px] w-full flex-col rounded-lg border p-4 md:p-8">
      <Link href="/blogs">
        <h3 className="cursor-pointer text-center text-xl font-semibold md:mb-4 md:text-2xl">
          Recently Updated
        </h3>
      </Link>
      <div className="mt-8 flex flex-col gap-8 md:mt-0">
        {recentlyBlogs?.map(blog => (
          <HorizontalCard key={blog.id} blog={blog} />
        ))}
      </div>
    </div>
  )
}
