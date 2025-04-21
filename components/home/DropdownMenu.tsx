import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import AvatarComponent from '../pages/Avatar'
// import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { UserRoundPen, LogOut } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

export default function DropdownMenuComponent({
  avatarUrl,
  username,
}: {
  avatarUrl?: string
  username?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 outline-none focus:outline-none focus-visible:outline-none">
        <Suspense
          fallback={<AvatarComponent src={avatarUrl} fallback={username} />}
        >
          <AvatarComponent src={avatarUrl} fallback={username} />
        </Suspense>
        {/* <ChevronDownIcon className="h-4 w-4 text-gray-500" /> */}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="text-sm font-bold">
          Your Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/profiles">
          <DropdownMenuItem>
            <UserRoundPen className="h-4 w-4" />
            Profile
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem>
          <form action="/signout" method="post">
            <button type="submit" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
