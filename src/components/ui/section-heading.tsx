import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  /** Id of the <h2>, for the section's `aria-labelledby`. */
  id: string
  children: ReactNode
  /** Optional link at the end of the rule, e.g. to the full list. */
  action?: { href: Route; label: string }
  className?: string
}

/** Home-page section title followed by a hairline rule. */
export function SectionHeading({
  id,
  children,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('mb-5 flex items-center gap-4', className)}>
      <h2
        id={id}
        className="text-section font-semibold tracking-[-0.01em] text-fg"
      >
        {children}
      </h2>
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
      {action && (
        <Link
          href={action.href}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          {action.label}
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  )
}
