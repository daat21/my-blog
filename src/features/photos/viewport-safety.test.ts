import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

// Honour repository exclusions when checking current and newly added sources.
const sources = execFileSync(
  'git',
  [
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '--',
    'src/features/photos/',
  ],
  { encoding: 'utf8' }
)
  .trim()
  .split('\n')
  .filter(path => /\.(?:tsx?|css)$/.test(path) && !/\.test\.tsx?$/.test(path))

describe('photo viewport safety', () => {
  it.each(sources)('%s uses stable image sizing', path => {
    const source = readFileSync(path, 'utf8')
    // Large viewport height is stable while Safari's browser chrome moves.
    expect(source).not.toMatch(/(?<![a-z])(?:d|s)?vh\b/)
    expect(source).not.toMatch(/scrollbar-gutter|scrollbarGutter/)
    // Viewport widths are resource hints only, never CSS layout widths.
    if (path.endsWith('.tsx')) {
      expect(source.replace(/\bsizes="[^"]*"/g, '')).not.toContain('100vw')
    }
  })
})
