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

export default function DropdownMenuComponent() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 outline-none focus:outline-none focus-visible:outline-none">
        <AvatarComponent />
        {/* <ChevronDownIcon className="h-4 w-4 text-gray-500" /> */}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="text-sm font-bold">
          Your Account
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserRoundPen className="h-4 w-4" />
          Profile
        </DropdownMenuItem>
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
