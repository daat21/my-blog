import type { Route } from 'next'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  /** Omit for a step without a page of its own. */
  href?: Route
}

interface BreadcrumbProps {
  /** From the top level down; the last item is the current page. */
  items: BreadcrumbItem[]
  className?: string
}

/** A mono trail such as `writing / 2026 / starting-over`. */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap gap-x-2 font-mono text-meta text-fg-muted">
        {items.map((item, index) => {
          const current = index === items.length - 1
          return (
            <li
              key={`${index}-${item.label}`}
              className={cn('flex min-w-0 gap-x-2', current && 'wrap-anywhere')}
            >
              {index > 0 && (
                <span aria-hidden="true" className="select-none">
                  /
                </span>
              )}
              {current ? (
                <span aria-current="page" className="min-w-0 text-fg">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  // The extension makes the tap target 44px tall.
                  className="relative transition-colors duration-150 before:absolute before:-inset-x-1 before:-inset-y-3 before:content-[''] hover:text-fg"
                >
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
