import type { ReactNode } from 'react'

interface EmptyStateProps {
  children: ReactNode
}

/** A dashed box with a short message, in place of a list with no items. */
export function EmptyState({ children }: EmptyStateProps) {
  return (
    <p className="rounded-lg border border-dashed border-border-strong px-6 py-10 text-center text-sm text-fg-muted">
      {children}
    </p>
  )
}
