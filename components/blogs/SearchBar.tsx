import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export default function SearchBar() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative flex w-full max-w-sm items-center">
        <Search className="text-muted-foreground absolute left-3 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search"
          className="rounded-2xl pl-10 md:text-base dark:border-0"
        />
      </div>
    </div>
  )
}
