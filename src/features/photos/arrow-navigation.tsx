'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Optional keyboard enhancement; ordinary links work without JavaScript. */
export function ArrowNavigation({
  previous,
  next,
}: {
  previous?: `/photos/${string}/${string}`
  next?: `/photos/${string}/${string}`
}) {
  const router = useRouter()
  useEffect(() => {
    function navigate(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return
      if (
        event.target instanceof HTMLElement &&
        event.target.closest(
          'input, textarea, select, button, [contenteditable], [role="dialog"]'
        )
      )
        return
      // The mobile menu owns keyboard interaction while it is open.
      if (
        document.querySelector(
          'dialog[open], [role="dialog"][aria-modal="true"]'
        )
      )
        return
      const href =
        event.key === 'ArrowLeft'
          ? previous
          : event.key === 'ArrowRight'
            ? next
            : undefined
      if (href) {
        event.preventDefault()
        router.push(href)
      }
    }
    window.addEventListener('keydown', navigate)
    return () => {
      window.removeEventListener('keydown', navigate)
    }
  }, [previous, next, router])
  return null
}
