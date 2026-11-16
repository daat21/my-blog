import { ImageResponse } from 'next/og'

import { ogPalette } from '@/lib/og/palette'

/** Initials of a name's first and last words, e.g. `DC` for Daming Chen. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0] ?? ''
  const last = words.length > 1 ? (words.at(-1) ?? '') : ''
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

/** A square app icon: the name's initials in the accent colour on canvas. */
export function renderMonogram(name: string, side: number): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: ogPalette.canvas,
        color: ogPalette.accent,
        fontSize: Math.round(side * 0.5),
        letterSpacing: -Math.round(side * 0.02),
      }}
    >
      {initials(name)}
    </div>,
    { width: side, height: side }
  )
}
