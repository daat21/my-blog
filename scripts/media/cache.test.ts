import { describe, expect, it } from 'vitest'

import { mediaCacheKey } from './cache.mts'
import { MEDIA_RECIPE } from './recipe.mts'

const input = Buffer.from('source bytes')
const source = 'photos/example.png'
const prefix = '/_media'

function key(recipe: unknown = MEDIA_RECIPE) {
  return mediaCacheKey(input, source, prefix, recipe)
}

describe('mediaCacheKey', () => {
  it('is deterministic and hashes bytes, not file timestamps', () => {
    expect(key()).toMatch(/^[0-9a-f]{64}$/)
    expect(mediaCacheKey(Buffer.from(input), source, prefix)).toBe(key())
    expect(mediaCacheKey(Buffer.from('changed'), source, prefix)).not.toBe(
      key()
    )
  })

  it('separates paths and public URL prefixes for identical sources', () => {
    expect(mediaCacheKey(input, 'other.png', prefix)).not.toBe(key())
    expect(mediaCacheKey(input, source, '/other')).not.toBe(key())
  })

  it.each([
    { widths: [320] },
    { formats: ['webp'] },
    {
      encoders: { ...MEDIA_RECIPE.encoders, avif: { quality: 40, effort: 4 } },
    },
    {
      encoders: { ...MEDIA_RECIPE.encoders, webp: { quality: 75, effort: 5 } },
    },
    { pipelineVersion: MEDIA_RECIPE.pipelineVersion + 1 },
    { sharp: { ...MEDIA_RECIPE.sharp, sharp: 'different' } },
    { sharp: { ...MEDIA_RECIPE.sharp, vips: 'different' } },
  ])('invalidates output settings: %j', change => {
    expect(key({ ...MEDIA_RECIPE, ...change })).not.toBe(key())
  })
})
