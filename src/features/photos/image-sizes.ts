// The `sizes` hints below follow the page frame: the sidebar is 260px wide
// from 1024px and 300px from 1280px, and the page gutters are 16px, 40px,
// 56px and 72px a side at the four tiers. Photos sit in a column of at
// most 1100px.

/** Photos are never taller than this share of the viewport, in percent. */
const MAX_HEIGHT = 80

/**
 * Width of a gallery tile at each tier: one column on phones, two from the
 * medium tier and three, 24px apart, from the full tier. The column reaches
 * its 1100px cap at a 1544px viewport.
 */
export const GALLERY_SIZES = [
  '(min-width: 1544px) 351px',
  '(min-width: 1280px) calc((100vw - 492px) / 3)',
  '(min-width: 1024px) calc((100vw - 396px) / 2)',
  '(min-width: 768px) calc((100vw - 104px) / 2)',
  'calc(100vw - 32px)',
].join(', ')

interface Dimensions {
  width: number
  height: number
}

/**
 * The width, in viewport-height units, at which a photo is exactly as tall
 * as the height cap. Rounded to two decimals.
 */
export function cappedWidth({ width, height }: Dimensions): number {
  return Math.round(((MAX_HEIGHT * width) / height) * 100) / 100
}

/**
 * Width of the photo on its page at each tier: the whole column, or less
 * when the height cap makes a tall photo narrower.
 */
export function photoSizes(image: Dimensions): string {
  const capped = `${cappedWidth(image)}vh`
  return [
    `(min-width: 1280px) min(100vw - 444px, 1100px, ${capped})`,
    `(min-width: 1024px) min(100vw - 372px, ${capped})`,
    `(min-width: 768px) min(100vw - 80px, ${capped})`,
    `min(100vw - 32px, ${capped})`,
  ].join(', ')
}
