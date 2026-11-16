import { describe, expect, it } from 'vitest'

import { cappedWidth, GALLERY_SIZES, photoSizes } from './image-sizes'

describe('cappedWidth', () => {
  it.each([
    [{ width: 2400, height: 1600 }, 120],
    [{ width: 1600, height: 2400 }, 53.33],
    [{ width: 2048, height: 2048 }, 80],
    [{ width: 2400, height: 1350 }, 142.22],
  ])('caps %o at %d viewport-height units wide', (image, expected) => {
    expect(cappedWidth(image)).toBe(expected)
  })
})

describe('photoSizes', () => {
  it('takes the column width, or less when the height cap applies', () => {
    expect(photoSizes({ width: 1600, height: 2400 })).toBe(
      [
        '(min-width: 1544px) min(720px, 53.33vh), (min-width: 1280px) min(100vw - 824px, 53.33vh)',
        '(min-width: 1024px) min(100vw - 372px, 53.33vh)',
        '(min-width: 768px) min(100vw - 80px, 53.33vh)',
        'min(100vw, 53.33vh)',
      ].join(', ')
    )
  })
})

describe('GALLERY_SIZES', () => {
  it('reaches the capped tile width where the column stops growing', () => {
    // At 1544px the full-tier formula and the fixed width agree.
    expect(Math.round((1544 - 492) / 3)).toBe(351)
    expect(GALLERY_SIZES).toMatch(/^\(min-width: 1544px\) 351px, /)
  })
})
