'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

/** Optional keyboard enhancement; ordinary links work without JavaScript. */
export function ArrowNavigation({
  current,
  previous,
  next,
}: {
  current: `/photos/${string}/${string}`
  previous?: `/photos/${string}/${string}`
  next?: `/photos/${string}/${string}`
}) {
  const router = useRouter()
  const readiness = useRef<HTMLSpanElement>(null)
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
    // A URL change can precede this effect. Identify the route whose listener
    // is installed, rather than treating navigation as keyboard readiness.
    const marker = readiness.current
    marker?.setAttribute('data-photo-keyboard-ready', current)
    return () => {
      marker?.removeAttribute('data-photo-keyboard-ready')
      window.removeEventListener('keydown', navigate)
    }
  }, [current, previous, next, router])
  return <span key={current} ref={readiness} hidden />
}
