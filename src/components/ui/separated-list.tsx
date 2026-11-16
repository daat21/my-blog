import { Fragment, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface SeparatedListProps {
  items: readonly ReactNode[]
  className?: string
  separator?: '·' | '→'
  /** Attach a final separator when more content follows outside the list. */
  trailingSeparator?: boolean
}

/** Wrap between items, keeping every separator with the item before it. */
export function SeparatedList({
  items,
  className,
  separator = '·',
  trailingSeparator = false,
}: SeparatedListProps) {
  return (
    <span
      className={cn(
        'inline-flex flex-wrap items-center gap-x-2.5 gap-y-1',
        className
      )}
      data-separated-list=""
    >
      {items.map((item, index) => (
        <Fragment key={index}>
          <span
            className="inline-flex items-center whitespace-nowrap"
            data-separated-item=""
          >
            <span data-separated-value="">{item}</span>
            {(index < items.length - 1 || trailingSeparator) && (
              <>
                {' '}
                <span
                  aria-hidden={separator === '·' ? true : undefined}
                  className="ml-2.5"
                  data-separator=""
                >
                  {separator}
                </span>
              </>
            )}
          </span>
          {index < items.length - 1 && ' '}
        </Fragment>
      ))}
    </span>
  )
}
