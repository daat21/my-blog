'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

export interface TocHeading {
  depth: 2 | 3
  /** The heading element's `id`. */
  id: string
  text: string
}

/**
 * A heading counts as "reached" once its top passes this far down the
 * viewport, so the highlight changes a little before the heading hits the
 * very top (and below the mobile top bar).
 */
const ACTIVATION_OFFSET = 120

function findActiveId(ids: readonly string[]): string | null {
  const atBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 2
  if (atBottom) return ids.at(-1) ?? null

  let active: string | null = null
  for (const id of ids) {
    const top = document.getElementById(id)?.getBoundingClientRect().top
    if (top === undefined) continue
    if (top <= ACTIVATION_OFFSET) active = id
    else break
  }
  return active
}

/** Tracks which heading the reader is in. `null` above the first one. */
function useActiveHeading(ids: readonly string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null)
  const key = ids.join('\n')

  useEffect(() => {
    const list = key.split('\n')
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        setActiveId(findActiveId(list))
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    window.addEventListener('hashchange', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      window.removeEventListener('hashchange', update)
    }
  }, [key])

  return activeId
}

interface TocLinksProps {
  headings: TocHeading[]
  className?: string
}

/**
 * Fragment links to the article's headings, with the current section
 * highlighted as the reader scrolls. Without JavaScript the links still work;
 * they just aren't highlighted.
 */
export function TocLinks({ headings, className }: TocLinksProps) {
  const activeId = useActiveHeading(headings.map(heading => heading.id))

  return (
    <ul className={cn('border-l border-border', className)}>
      {headings.map(heading => {
        const active = heading.id === activeId
        return (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={active ? 'location' : undefined}
              className={cn(
                '-ml-px flex min-h-11 items-center border-l-2 py-1.5 pr-2 text-sm transition-colors duration-150',
                heading.depth === 2 ? 'pl-3.5' : 'pl-6.5',
                active
                  ? 'border-accent font-medium text-accent'
                  : 'border-transparent text-fg-muted hover:text-fg'
              )}
            >
              {heading.text}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
