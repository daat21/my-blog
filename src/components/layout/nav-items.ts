import type { Route } from 'next'

export interface NavItem {
  href: Route
  label: string
}

/** Primary navigation, in display order. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/writing', label: 'Writing' },
  { href: '/photos', label: 'Photos' },
  { href: '/projects', label: 'Projects' },
]

/** Whether `href` is the current section for `pathname`. */
export function isActive(href: Route, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}
