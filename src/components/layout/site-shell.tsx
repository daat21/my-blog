import type { ReactNode } from 'react'

import type { TagCount } from '@/lib/content/types'

import { MobileNav } from './mobile-nav'
import { SidebarContent, type SidebarProfile } from './sidebar-content'

interface SiteShellProps {
  profile: SidebarProfile
  topics: TagCount[]
  children: ReactNode
}

/**
 * Page frame for every public page.
 * - Compact and medium tiers (< 1024px): top bar with a menu sheet.
 * - Wide tier (1024–1279px): persistent 260px sidebar.
 * - Full tier (≥ 1280px): persistent 300px sidebar.
 */
export function SiteShell({ profile, topics, children }: SiteShellProps) {
  const sidebar = <SidebarContent profile={profile} topics={topics} />

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="lg:flex">
        <MobileNav name={profile.name}>{sidebar}</MobileNav>
        <aside
          aria-label="Site"
          className="hidden border-r border-border bg-surface lg:sticky lg:top-0 lg:block lg:h-dvh lg:w-65 lg:shrink-0 lg:overflow-y-auto xl:w-75"
        >
          {sidebar}
        </aside>
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </>
  )
}
