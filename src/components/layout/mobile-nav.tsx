'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Suspense,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react'

/** Closes the dialog whenever the URL changes. Reads the URL, so it sits
 * in its own <Suspense> boundary and renders nothing. */
function CloseOnNavigate({
  dialogRef,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>
}) {
  const pathname = usePathname()
  useEffect(() => {
    dialogRef.current?.close()
  }, [pathname, dialogRef])
  return null
}

interface MobileNavProps {
  name: string
  /** The sidebar content, rendered inside the menu sheet. */
  children: ReactNode
}

/**
 * Top bar with a menu button for the compact and medium tiers (< 1024px).
 * The menu is a native modal <dialog>: focus is trapped, Escape closes it,
 * and the page behind it is inert.
 */
export function MobileNav({ name, children }: MobileNavProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <>
      <Suspense fallback={null}>
        <CloseOnNavigate dialogRef={dialogRef} />
      </Suspense>
      <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-border bg-canvas px-4 pt-[env(safe-area-inset-top)] lg:hidden">
        <Link
          href="/"
          className="flex min-h-11 items-center text-ui font-semibold tracking-tight text-fg"
        >
          {name}
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          aria-haspopup="dialog"
          onClick={() => dialogRef.current?.showModal()}
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-md text-fg transition-colors duration-150 hover:bg-sunken"
        >
          <svg
            aria-hidden="true"
            className="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      <dialog
        ref={dialogRef}
        aria-label="Site menu"
        onClick={event => {
          // A click on the backdrop lands on the dialog element itself.
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-surface text-fg-body opacity-100 transition-opacity duration-150 backdrop:bg-fg/40 open:flex open:flex-col sm:max-w-sm lg:hidden starting:open:opacity-0"
      >
        <div className="flex justify-end px-3 pt-3">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex size-11 items-center justify-center rounded-md text-fg transition-colors duration-150 hover:bg-sunken"
          >
            <svg
              aria-hidden="true"
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="-mt-8 flex-1">{children}</div>
      </dialog>
    </>
  )
}
