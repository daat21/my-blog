import { describe, expect, it } from 'vitest'

import { initials } from '@/lib/og/monogram'

describe('initials', () => {
  it.each([
    ['Daming Chen', 'DC'],
    ['Avery Example', 'AE'],
    ['ada lovelace', 'AL'],
    ['Mary Ann Evans', 'ME'],
    ['  Plato  ', 'P'],
    ['Émile Zola', 'ÉZ'],
    ['', ''],
  ])('turns %j into %j', (name, expected) => {
    expect(initials(name)).toBe(expected)
  })
})
