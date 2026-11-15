import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface FigureProps {
  /** The image or video, shown in a framed box at the column's width. */
  children: ReactNode
  caption?: ReactNode
  /** Shown as `Fig. 1` before the caption. */
  number?: number
  className?: string
}

/** A framed image or video with an optional, numbered mono caption. */
export function Figure({ children, caption, number, className }: FigureProps) {
  return (
    <figure className={cn('my-9 flex flex-col gap-2.5', className)}>
      <div className="overflow-hidden rounded-md border border-border bg-sunken">
        {children}
      </div>
      {caption ? (
        <figcaption className="font-mono text-meta text-fg-muted">
          {number !== undefined && (
            <>
              <span className="text-fg">Fig. {number}</span> —{' '}
            </>
          )}
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
