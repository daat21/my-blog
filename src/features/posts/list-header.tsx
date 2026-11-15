import type { ReactNode } from 'react'

interface ListHeaderProps {
  title: ReactNode
  description: ReactNode
}

/** The title and introduction above a list of posts. */
export function ListHeader({ title, description }: ListHeaderProps) {
  return (
    <header className="mb-10 flex flex-col gap-3.5">
      <h1 className="text-h1 font-semibold tracking-[-0.022em] text-balance text-fg">
        {title}
      </h1>
      <p className="text-lead text-fg-muted">{description}</p>
    </header>
  )
}
