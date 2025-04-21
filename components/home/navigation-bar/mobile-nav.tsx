'use client'

import { useState } from 'react'
import {
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
  NavbarLogo,
} from '@/components/ui/resizable-navbar'
import { ModeToggleMobile } from '@/components/ui/mode-toggle'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface MobileNavigationProps {
  navItems: {
    name: string
    link: string
  }[]
}

export default function MobileNavigation({ navItems }: MobileNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <MobileNav>
      <MobileNavHeader>
        <NavbarLogo />
        <div className="flex items-center gap-4">
          <ModeToggleMobile />
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </div>
      </MobileNavHeader>

      <MobileNavMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      >
        {navItems.map((item, idx) => (
          <Link
            key={`mobile-link-${idx}`}
            href={item.link}
            onClick={() => setIsMobileMenuOpen(false)}
            className="relative text-neutral-600 dark:text-neutral-300"
          >
            <span className="block">{item.name}</span>
          </Link>
        ))}
        <div className="flex w-full flex-col gap-4">
          <Button
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full rounded-2xl"
            asChild
          >
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </MobileNavMenu>
    </MobileNav>
  )
}
