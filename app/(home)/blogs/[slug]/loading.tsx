import BlogPostSkeleton from '@/components/blogs/BlogPostSkeleton'

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-screen-xl px-0 py-8 sm:px-4">
      <BlogPostSkeleton />
    </main>
  )
}
