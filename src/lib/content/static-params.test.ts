import { describe, expect, it } from 'vitest'

import { isSlug } from './file-system-source'
import { PLACEHOLDER_PARAM, staticParams } from './static-params'

describe('staticParams', () => {
  it('maps values to params for the given key', () => {
    expect(staticParams('slug', ['a', 'b'])).toEqual([
      { slug: 'a' },
      { slug: 'b' },
    ])
  })

  it('returns a single placeholder when there are no values', () => {
    expect(staticParams('tag', [])).toEqual([{ tag: PLACEHOLDER_PARAM }])
  })

  it('uses a placeholder that can never be a real slug', () => {
    expect(isSlug(PLACEHOLDER_PARAM)).toBe(false)
  })
})
