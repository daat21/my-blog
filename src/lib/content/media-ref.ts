import type { MediaRef } from '@/lib/media/types'

const PREFIX = 'media:'

/**
 * Checks that a string is a `media:` reference to a path below `media/`:
 * relative, without empty, `.` or `..` segments, whitespace or backslashes.
 */
export function isMediaRef(value: string): value is MediaRef {
  if (!value.startsWith(PREFIX)) return false
  const path = value.slice(PREFIX.length)
  if (path === '' || /[\s\\?#]/.test(path)) return false
  return path
    .split('/')
    .every(segment => segment !== '' && segment !== '.' && segment !== '..')
}
