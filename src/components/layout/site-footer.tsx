/** Resolved when the page is prerendered, and refreshed by every build. */
// eslint-disable-next-line @typescript-eslint/require-await -- 'use cache' functions must be async even when they await nothing.
async function copyrightYear(): Promise<number> {
  'use cache'
  return new Date().getFullYear()
}

interface SiteFooterProps {
  name: string
}

export async function SiteFooter({ name }: SiteFooterProps) {
  const year = await copyrightYear()

  return (
    <footer className="px-4 pb-10 md:px-12 lg:px-18 xl:px-22">
      <div className="mx-auto max-w-190 border-t border-border pt-6 text-sm text-fg-muted">
        © {year} {name}
      </div>
    </footer>
  )
}
