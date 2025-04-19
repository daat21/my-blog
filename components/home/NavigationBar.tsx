'use client'
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from '@/components/ui/resizable-navbar'
import { useState } from 'react'
import { ModeToggle, ModeToggleMobile } from '@/components/ui/mode-toggle'
import { Button } from '../ui/button'
import Link from 'next/link'

export default function NavigationBar() {
  const navItems = [
    {
      name: 'About',
      link: '/',
    },
    {
      name: 'Blogs',
      link: '/blogs',
    },
    {
      name: 'Projects',
      link: '/projects',
    },
    {
      name: 'Contact',
      link: '/contact',
    },
  ]

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    // <nav className="relative">
    <nav>
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Button asChild className="rounded-2xl">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </NavBody>
      </Navbar>

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
    </nav>
  )
}
