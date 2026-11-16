import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Page not found' }

// Rendered inside the root layout but outside the site shell, so it brings
// its own landmark and centres itself in the viewport.
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
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
    </main>
  )
}
