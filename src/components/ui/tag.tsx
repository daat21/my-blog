import Link from 'next/link'

import { cn } from '@/lib/utils'

interface TagProps {
  /** A normalised tag, such as `next-js`. */
  tag: string
  className?: string
}

/**
 * A tag chip linking to the tag's page. The chip stays compact, and an
 * invisible extension makes the tap target 44px tall.
 */
export function Tag({ tag, className }: TagProps) {
  return (
    <Link
      href={`/tags/${tag}`}
      className={cn(
        "relative inline-flex items-center rounded-full border border-border px-2.25 py-0.75 font-mono text-meta text-fg-body transition-colors duration-150 before:absolute before:inset-x-0 before:-inset-y-2.25 before:content-[''] hover:border-border-strong hover:text-fg",
        className
      )}
    >
      #{tag}
    </Link>
  )
}
