import { describe, expect, it } from 'vitest'

import { parseMediaManifest } from '@/lib/media/manifest'

const image = {
  kind: 'image',
  hash: '0123456789ab',
  width: 2000,
  height: 1000,
  variants: [
    { format: 'avif', width: 640, src: '/_media/a/home.0123456789ab.640.avif' },
    { format: 'webp', width: 640, src: '/_media/a/home.0123456789ab.640.webp' },
  ],
}

const video = {
  kind: 'video',
  hash: 'ba9876543210',
  width: 1280,
  height: 720,
  type: 'video/mp4',
  src: '/_media/a/clip.ba9876543210.mp4',
}

function manifest(items: Record<string, unknown>): unknown {
  return { version: 1, items }
}

// eslint-disable-next-line no-restricted-syntax -- Manifest data, not styles.
const [COLOR, UPPERCASE_COLOR, SHORT_COLOR] = ['#c87828', '#C87828', '#c87']

describe('parseMediaManifest', () => {
  it('accepts images and videos', () => {
    const parsed = parseMediaManifest(
      manifest({ 'a/home.png': image, 'a/clip.mp4': video }),
      'manifest.json'
    )
    expect(parsed.items['a/home.png']).toEqual(image)
    expect(parsed.items['a/clip.mp4']).toEqual(video)
  })

  it('accepts an image with its dominant colour', () => {
    const parsed = parseMediaManifest(
      manifest({ 'a/home.png': { ...image, color: COLOR } }),
      'manifest.json'
    )
    expect(parsed.items['a/home.png']).toMatchObject({ color: COLOR })
  })

  it('accepts an empty manifest', () => {
    expect(parseMediaManifest(manifest({}), 'manifest.json').items).toEqual({})
  })

  it.each([
    ['an unknown version', { version: 2, items: {} }],
    ['a missing items map', { version: 1 }],
    ['an unknown kind', manifest({ 'a.svg': { ...image, kind: 'vector' } })],
    [
      'an image without WebP',
      manifest({ 'a.png': { ...image, variants: image.variants.slice(0, 1) } }),
    ],
    ['a fractional width', manifest({ 'a.png': { ...image, width: 10.5 } })],
    ['a named colour', manifest({ 'a.png': { ...image, color: 'red' } })],
    [
      'an uppercase colour',
      manifest({ 'a.png': { ...image, color: UPPERCASE_COLOR } }),
    ],
    [
      'a three-digit colour',
      manifest({ 'a.png': { ...image, color: SHORT_COLOR } }),
    ],
    ['a zero height', manifest({ 'a.mp4': { ...video, height: 0 } })],
    ['an unknown video type', manifest({ 'a.mp4': { ...video, type: 'x' } })],
    ['an uppercase hash', manifest({ 'a.mp4': { ...video, hash: 'ABC' } })],
    [
      'a URL with a space',
      manifest({ 'a.mp4': { ...video, src: '/a b.mp4' } }),
    ],
    [
      'a URL with a comma',
      manifest({
        'a.png': {
          ...image,
          variants: [{ format: 'webp', width: 640, src: '/a,b.webp' }],
        },
      }),
    ],
  ])('rejects %s', (_, data) => {
    expect(() => parseMediaManifest(data, 'manifest.json')).toThrow(
      /Invalid media manifest/
    )
  })

  it('names the file and how to fix it', () => {
    expect(() => parseMediaManifest({}, '/repo/.media/manifest.json')).toThrow(
      /\/repo\/\.media\/manifest\.json[\s\S]*pnpm media:build/
    )
  })
})
