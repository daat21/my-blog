import { describe, expect, it } from 'vitest'

import { formatCount } from './format-count'

describe('formatCount', () => {
  it.each(['album', 'photo', 'post'])(
    'formats zero, one and multiple %s counts',
    noun => {
      expect(formatCount(0, noun)).toBe(`0 ${noun}s`)
      expect(formatCount(1, noun)).toBe(`1 ${noun}`)
      expect(formatCount(2, noun)).toBe(`2 ${noun}s`)
    }
  )
})
