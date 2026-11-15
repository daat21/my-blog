import { readFile } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'

import { ogPalette } from '@/lib/og/palette'

/** Reads the light tokens: the first `:root { … }` block of the stylesheet. */
async function lightTokens(): Promise<Map<string, string>> {
  const css = await readFile(
    new URL('../../styles/globals.css', import.meta.url),
    'utf8'
  )
  const block = /:root\s*\{([^}]*)\}/.exec(css)?.[1]
  if (block === undefined) throw new Error('No :root block in globals.css')
  return new Map(
    [...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name ?? '',
      value?.trim() ?? '',
    ])
  )
}

const tokenName = (key: string) =>
  key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)

describe('ogPalette', () => {
  it.each(Object.entries(ogPalette))(
    'mirrors the light %s token',
    async (key, value) => {
      const tokens = await lightTokens()
      expect(tokens.get(tokenName(key))).toBe(value)
    }
  )
})
