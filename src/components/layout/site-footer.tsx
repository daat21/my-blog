import { cacheLife } from 'next/cache'

import { getProfile } from '@/lib/content'
import { cn } from '@/lib/utils'

/** Resolved when the page is prerendered, and refreshed by every build. */
// eslint-disable-next-line @typescript-eslint/require-await -- 'use cache' functions must be async even when they await nothing.
async function copyrightYear(): Promise<number> {
  'use cache'
  // Without an explicit lifetime this would default to 15 minutes and make
  // every page revalidate that often.
  cacheLife('max')
  return new Date().getFullYear()
}

interface SiteFooterProps {
  className?: string
}

/**
 * The site footer. Each page renders it at the end of its own content
 * column, so it always lines up with that page's content, whatever the
 * column's width.
 */
export async function SiteFooter({ className }: SiteFooterProps) {
  const [{ name }, year] = await Promise.all([getProfile(), copyrightYear()])

  return (
    <div className="mt-auto pt-20">
      <footer
        className={cn(
          'border-t border-border pt-6 text-sm text-fg-muted',
          className
        )}
      >
        © {year} {name}
      </footer>
    </div>
  )
}
