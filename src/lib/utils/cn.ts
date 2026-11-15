import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Our font-size tokens share the `text-` prefix with colour tokens, so
 * tailwind-merge has to be told which is which.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'label',
        'meta',
        'sm',
        'ui',
        'body',
        'lead',
        'section',
        'h2',
        'display',
        'h1',
      ],
    },
  },
})

/** Joins class names and resolves conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
