import { describe, expect, it } from 'vitest'

import { widestWebp } from './widest-webp'

const BASE = '/_media/photos/low-sun.0123456789ab'

describe('widestWebp', () => {
  it('picks the widest WebP candidate and keeps the aspect ratio', () => {
    expect(
      widestWebp({
        width: 2400,
        height: 1600,
        sources: [
          { type: 'image/avif', srcSet: `${BASE}.2048.avif 2048w` },
          {
            type: 'image/webp',
            srcSet: [
              `${BASE}.640.webp 640w`,
              `${BASE}.2048.webp 2048w`,
              `${BASE}.960.webp 960w`,
            ].join(', '),
          },
        ],
      })
    ).toEqual({ url: `${BASE}.2048.webp`, width: 2048, height: 1365 })
  })

  it('is undefined without a WebP source', () => {
    expect(
      widestWebp({
        width: 800,
        height: 600,
        sources: [{ type: 'image/avif', srcSet: `${BASE}.800.avif 800w` }],
      })
    ).toBeUndefined()
  })
})
