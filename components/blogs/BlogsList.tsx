import { BlogFromNotionCard } from '@/components/pages/Cards'
import { listBlogPosts } from '@/lib/notion/notion-blogs-list'

export default async function BlogsList() {
  const blogs = await listBlogPosts()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-stretch justify-center gap-10">
      {blogs
        ?.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .map(blog => <BlogFromNotionCard key={blog.id} blog={blog} />)}
    </div>
  )
}
