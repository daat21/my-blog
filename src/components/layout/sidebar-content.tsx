import Link from 'next/link'
import { Suspense } from 'react'

import type { Profile, TagCount } from '@/lib/content/types'

import { NavLinks, NavList } from './nav-links'
import { ThemeToggle } from './theme-toggle'

export interface SidebarProfile {
  name: Profile['name']
  role: Profile['role']
  location: Profile['location']
  bio: Profile['bio']
  links: Profile['links']
}

interface SidebarContentProps {
  profile: SidebarProfile
  topics: TagCount[]
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map(part => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Profile, navigation, topics and footer links. Shared by the desktop sidebar
 * and the mobile navigation sheet.
 */
export function SidebarContent({ profile, topics }: SidebarContentProps) {
  return (
    <div className="flex min-h-full flex-col gap-7 px-6 pt-10 pb-6 xl:gap-9 xl:px-7 xl:pt-12 xl:pb-8">
      <div className="flex flex-col gap-4.5 px-2">
        <div
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full border border-border-strong bg-sunken font-mono text-sm text-fg"
        >
          {initials(profile.name)}
        </div>
        <div className="flex flex-col gap-1">
          <Link
            href="/"
            className="w-fit text-section font-semibold tracking-tight text-fg"
          >
            {profile.name}
          </Link>
          <p className="text-sm text-fg-muted">
            {profile.role} · {profile.location}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-fg-body xl:text-ui">
          {profile.bio}
        </p>
      </div>

      <Suspense fallback={<NavList pathname={null} />}>
        <NavLinks />
      </Suspense>

      {topics.length > 0 && (
        <div className="flex flex-col gap-3 px-2">
          <p className="font-mono text-label text-fg-muted uppercase">Topics</p>
          <ul className="flex flex-wrap gap-2">
            {topics.map(({ tag }) => (
              <li key={tag}>
                <Link
                  href={`/tags/${tag}`}
                  className="inline-flex min-h-9 items-center rounded-full border border-border-control px-3 text-sm text-fg-body transition-colors duration-150 hover:bg-sunken"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-5 pl-2">
        <ul className="flex flex-wrap gap-x-3 text-sm text-fg-body xl:gap-x-4">
          {profile.links.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                className="flex min-h-11 items-center transition-colors duration-150 hover:text-fg"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="/rss.xml"
              className="flex min-h-11 items-center transition-colors duration-150 hover:text-fg"
            >
              RSS
            </a>
          </li>
        </ul>
        <ThemeToggle />
      </div>
    </div>
  )
}
