'use client'

import {
  Navbar,
  NavBody,
  NavItems,
  NavbarLogo,
} from '@/components/ui/resizable-navbar'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import DropdownMenuComponent from '../DropdownMenu'

interface DesktopNavigationProps {
  navItems: {
    name: string
    link: string
  }[]
  className?: string
  isAuthenticated?: boolean
}

export default function DesktopNavigation({
  navItems,
  className,
  isAuthenticated,
}: DesktopNavigationProps) {
  return (
    <Navbar className={`py-1 ${className || ''}`}>
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} />
        <div className="flex items-center gap-4">
          <ModeToggle />
          {isAuthenticated ? (
            <DropdownMenuComponent />
          ) : (
            <Button asChild className="rounded-2xl">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </NavBody>
    </Navbar>
  )
}
