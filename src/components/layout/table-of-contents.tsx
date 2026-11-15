import { cn } from '@/lib/utils'

export interface TocHeading {
  depth: 2 | 3
  /** The heading element's `id`. */
  id: string
  text: string
}

interface TableOfContentsProps {
  headings: TocHeading[]
  /**
   * - `rail`: the right-hand column of the full tier (≥ 1280px).
   * - `collapsible`: a closed `<details>` at the top of the article, for
   *   narrower tiers.
   */
  variant: 'rail' | 'collapsible'
  className?: string
}

const LABEL = 'On this page'

function HeadingLinks({
  headings,
  className,
}: {
  headings: TocHeading[]
  className?: string
}) {
  return (
    <ul className={cn('border-l border-border', className)}>
      {headings.map(heading => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            className={cn(
              'flex min-h-11 items-center py-1.5 pr-2 text-sm text-fg-muted transition-colors duration-150 hover:text-fg',
              heading.depth === 2 ? 'pl-3.75' : 'pl-7'
            )}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  )
}

/**
 * Links to the article's `h2` and `h3` headings. Plain fragment links, so
 * it works without JavaScript. Renders nothing when there are no headings.
 */
export function TableOfContents({
  headings,
  variant,
  className,
}: TableOfContentsProps) {
  if (headings.length === 0) return null

  if (variant === 'collapsible') {
    return (
      <details
        className={cn('group rounded-md border border-border', className)}
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 font-mono text-label font-medium tracking-[0.1em] text-fg uppercase [&::-webkit-details-marker]:hidden">
          {LABEL}
          <svg
            aria-hidden="true"
            className="size-4 text-fg-muted group-open:rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <nav aria-label={LABEL} className="px-4 pt-1 pb-3">
          <HeadingLinks headings={headings} />
        </nav>
      </details>
    )
  }

  return (
    <nav
      aria-label={LABEL}
      className={cn(
        'sticky top-0 max-h-dvh overflow-y-auto pt-28 pr-7 pb-12 pl-4',
        className
      )}
    >
      <p className="mb-2.5 font-mono text-label font-medium tracking-[0.1em] text-fg uppercase">
        {LABEL}
      </p>
      <HeadingLinks headings={headings} className="mb-6" />
      <a
        href="#top"
        className="flex min-h-11 items-center font-mono text-meta text-fg-muted transition-colors duration-150 hover:text-fg"
      >
        <span aria-hidden="true">↑&nbsp;</span>back to top
      </a>
    </nav>
  )
}
