import type { Metadata } from 'next'
import Link from 'next/link'

import { SiteFooter } from '@/components/layout/site-footer'

export const metadata: Metadata = { title: 'Page not found' }

// Rendered inside the root layout but outside the site shell, so it brings
// its own landmark and reading column.
export default function NotFound() {
  return (
    <main className="flex min-h-lvh flex-1 flex-col px-4 py-10 text-center">
      <div className="mx-auto flex w-full max-w-172.5 flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center">
          <h1 className="text-h1 font-semibold tracking-tight text-fg">
            Page not found
          </h1>
          <p className="mt-4 max-w-md text-body">
            This page doesn’t exist, or it has moved.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-11 items-center text-ui font-medium text-accent underline underline-offset-4 hover:no-underline"
          >
            Back to the home page
          </Link>
        </div>
        <SiteFooter />
      </div>
    </main>
  )
}
