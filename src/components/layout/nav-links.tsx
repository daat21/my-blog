'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

import { NAV_ITEMS, isActive } from './nav-items'

interface NavListProps {
  /** Current pathname, or `null` when not yet known (nothing highlighted). */
  pathname: string | null
}

/** Numbered primary navigation. */
export function NavList({ pathname }: NavListProps) {
  return (
    <nav aria-label="Primary">
      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item, index) => {
          const active = pathname !== null && isActive(item.href, pathname)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-3.5 rounded-sm px-3 text-ui transition-colors duration-150',
                  active
                    ? 'bg-accent-tint font-medium text-accent'
                    : 'text-fg-body hover:bg-sunken'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'font-mono text-meta',
                    active ? 'text-accent' : 'text-fg-muted'
                  )}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/**
 * Navigation with the current section highlighted. Reads the URL, so render
 * it inside <Suspense> with `<NavList pathname={null} />` as the fallback.
 */
export function NavLinks() {
  return <NavList pathname={usePathname()} />
}
