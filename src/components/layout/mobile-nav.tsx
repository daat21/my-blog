'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, type ReactNode } from 'react'

/** Longest the slide-out may take before the dialog closes regardless. */
const CLOSE_FALLBACK_MS = 400

/**
 * Slides the sheet out (see `.menu-sheet[data-closing]`), then closes the
 * dialog. Closes at once when motion is reduced or the sheet isn't open.
 */
function closeWithSlide(dialog: HTMLDialogElement | null) {
  if (!dialog?.open || 'closing' in dialog.dataset) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dialog.close()
    return
  }

  const finish = () => {
    clearTimeout(timer)
    dialog.removeEventListener('transitionend', onEnd)
    delete dialog.dataset.closing
    dialog.close()
  }
  const onEnd = (event: TransitionEvent) => {
    if (event.target === dialog && event.propertyName === 'translate') finish()
  }
  const timer = setTimeout(finish, CLOSE_FALLBACK_MS)
  dialog.addEventListener('transitionend', onEnd)
  dialog.dataset.closing = ''
}

/** Closes the menu whenever the URL changes. Reads the URL, so it sits in
 * its own <Suspense> boundary and renders nothing. */
function CloseOnNavigate({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname()
  useEffect(() => {
    onNavigate()
  }, [pathname, onNavigate])
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
  // Stable identity, so CloseOnNavigate's effect runs only on URL changes.
  const closeMenu = useCallback(() => {
    closeWithSlide(dialogRef.current)
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <CloseOnNavigate onNavigate={closeMenu} />
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
          if (event.target === event.currentTarget) closeMenu()
        }}
        onCancel={event => {
          // Escape: slide out instead of vanishing.
          event.preventDefault()
          closeMenu()
        }}
        className="menu-sheet m-0 h-dvh max-h-none w-full max-w-none bg-surface text-fg-body open:flex open:flex-col sm:max-w-sm sm:border-r sm:border-border lg:hidden"
      >
        {/* Positioned above the sheet content so nothing can cover it. */}
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMenu}
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
        <div className="flex-1">{children}</div>
      </dialog>
    </>
  )
}
