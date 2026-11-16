import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  description: ReactNode
  className?: string
}

/** The title and introduction at the top of a list page. */
export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-10 flex flex-col gap-3.5', className)}>
      <h1 className="text-h1 font-semibold tracking-[-0.022em] text-balance text-fg">
        {title}
      </h1>
      <p className="text-lead text-fg-muted">{description}</p>
    </header>
  )
}
