import SearchBar from '@/components/blogs/SearchBar'
import Tags from '@/components/blogs/Tags'
import BlogsList from '@/components/blogs/BlogsList'

export default function BlogsPage() {
  return (
    <div className="flex flex-col gap-10 pb-10">
      <SearchBar />
      <Tags />
      <BlogsList />
    </div>
  )
}
