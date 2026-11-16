'use client'

import { cn } from '@/lib/utils'

import { THEME_STORAGE_KEY, type Theme } from './theme'

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function toggleTheme() {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    // Storage can be unavailable (private mode); the change still applies.
  }
}

interface ThemeToggleProps {
  className?: string
}

/**
 * Switches between light and dark. The icons are shown by CSS from the
 * resolved theme, so the server and client render the same markup.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark theme"
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-border-control text-fg-body transition-colors duration-150 hover:bg-sunken',
        className
      )}
    >
      <svg
        aria-hidden="true"
        className="size-4.5 dark:hidden"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
      <svg
        aria-hidden="true"
        className="hidden size-4.5 dark:block"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  )
}
