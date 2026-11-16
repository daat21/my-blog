'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

interface CopyButtonProps {
  /** The text written to the clipboard. */
  text: string
  /** What is copied, for the accessible label: `Copy ${label}`. */
  label?: string
  className?: string
}

/** How long the button shows that copying worked. */
const CONFIRMATION_MS = 2000

/** Copies text to the clipboard and confirms it, visibly and to screen readers. */
export function CopyButton({
  text,
  label = 'code',
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => {
      setCopied(false)
    }, CONFIRMATION_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // Clipboard access can be denied; there is nothing useful to show.
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Copy ${label}`}
        onClick={() => {
          void copy()
        }}
        className={cn(
          'inline-flex size-11 items-center justify-center rounded-sm text-fg-muted transition-colors duration-150 hover:text-fg',
          className
        )}
      >
        <svg
          aria-hidden="true"
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {copied ? (
            <path d="M5 12.5 10 17.5 19 7" />
          ) : (
            <>
              <rect x="9" y="9" width="12" height="12" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </>
          )}
        </svg>
      </button>
      <span role="status" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </>
  )
}
