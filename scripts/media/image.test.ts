import { mkdir, mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { MediaSource, OutputTarget } from './files.mts'
import { planImageWidths, processImage, rejectGif } from './image.mts'

let root: string
let target: OutputTarget

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'media-image-'))
  target = { dir: path.join(root, 'out'), publicPath: '/_media' }
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

interface ImageOptions {
  width: number
  height: number
  /** Changes the pixels, and with them the content hash. */
  red?: number
  orientation?: number
}

/** Writes a solid-colour image below the media root; the format follows the extension. */
async function createImage(
  key: string,
  { width, height, red = 200, orientation }: ImageOptions
): Promise<MediaSource> {
  const file = path.join(root, 'media', key)
  await mkdir(path.dirname(file), { recursive: true })
  let image = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: red, g: 120, b: 40 },
    },
  })
  if (orientation) image = image.withMetadata({ orientation })
  await image.toFile(file)
  return { key, file }
}

function outputFile(src: string): string {
  return path.join(
    target.dir,
    decodeURIComponent(src.replace(/^\/_media\//, ''))
  )
}

async function inode(file: string): Promise<number> {
  return (await stat(file)).ino
}

describe('planImageWidths', () => {
  it.each([
    [2400, [640, 960, 1440]],
    [1440, [640, 960, 1440]],
    [1000, [640, 960, 1000]],
    [960, [640, 960]],
    [800, [640, 800]],
    [640, [640]],
    [300, [300]],
  ])('plans widths for an image %i px wide', (width, expected) => {
    expect(planImageWidths(width)).toEqual(expected)
  })
})

describe('processImage', () => {
  it('writes AVIF and WebP variants at each target width', async () => {
    const source = await createImage('2026/post/home.png', {
      width: 1600,
      height: 800,
    })

    const { entry, outputs, skipped } = await processImage(source, target)

    expect(skipped).toBe(false)
    expect(entry).toMatchObject({ kind: 'image', width: 1600, height: 800 })
    expect(entry.hash).toMatch(/^[0-9a-f]{12}$/)
    expect(entry.variants.map(v => `${v.format} ${v.width}`)).toEqual([
      'avif 640',
      'avif 960',
      'avif 1440',
      'webp 640',
      'webp 960',
      'webp 1440',
    ])

    for (const variant of entry.variants) {
      const name = `2026/post/home.${entry.hash}.${variant.width}.${variant.format}`
      expect(variant.src).toBe(`/_media/${name}`)
      const metadata = await sharp(path.join(target.dir, name)).metadata()
      expect(metadata.width).toBe(variant.width)
      expect(metadata.height).toBe(variant.width / 2)
      if (variant.format === 'avif') {
        expect(metadata).toMatchObject({ format: 'heif', compression: 'av1' })
      } else {
        expect(metadata.format).toBe('webp')
      }
    }
    expect(outputs).toEqual(
      entry.variants.map(variant => variant.src.replace('/_media/', ''))
    )
  })

  it('caps the widths at the original width instead of upscaling', async () => {
    const source = await createImage('photo.jpg', { width: 800, height: 600 })

    const { entry } = await processImage(source, target)

    expect(entry).toMatchObject({ width: 800, height: 600 })
    expect(entry.variants.map(v => `${v.format} ${v.width}`)).toEqual([
      'avif 640',
      'avif 800',
      'webp 640',
      'webp 800',
    ])
    for (const variant of entry.variants) {
      const metadata = await sharp(outputFile(variant.src)).metadata()
      expect(metadata.width).toBe(variant.width)
    }
  })

  it('writes one variant per format for an image narrower than 640 px', async () => {
    const source = await createImage('icon.webp', { width: 300, height: 200 })

    const { entry } = await processImage(source, target)

    expect(entry.variants.map(v => `${v.format} ${v.width}`)).toEqual([
      'avif 300',
      'webp 300',
    ])
  })

  it('uses the displayed size of a JPEG rotated by its EXIF orientation', async () => {
    const source = await createImage('portrait.jpg', {
      width: 200,
      height: 100,
      orientation: 6,
    })

    const { entry } = await processImage(source, target)

    expect(entry).toMatchObject({ width: 100, height: 200 })
    const [first] = entry.variants
    expect(first?.width).toBe(100)
    const metadata = await sharp(outputFile(first?.src ?? '')).metadata()
    expect(metadata).toMatchObject({ width: 100, height: 200 })
  })

  it('names outputs by content hash', async () => {
    const a = await createImage('a.png', { width: 100, height: 100 })
    const sameAsA = await createImage('b.png', { width: 100, height: 100 })
    const different = await createImage('c.png', {
      width: 100,
      height: 100,
      red: 10,
    })

    const [hashA, hashSame, hashDifferent] = await Promise.all(
      [a, sameAsA, different].map(async source => {
        const { entry } = await processImage(source, target)
        return entry.hash
      })
    )

    expect(hashSame).toBe(hashA)
    expect(hashDifferent).not.toBe(hashA)
  })

  it('percent-encodes file names in URLs', async () => {
    const source = await createImage('my post/a, b.png', {
      width: 100,
      height: 50,
    })

    const { entry } = await processImage(source, target)

    expect(entry.variants.map(variant => variant.src)).toEqual([
      `/_media/my%20post/a%2C%20b.${entry.hash}.100.avif`,
      `/_media/my%20post/a%2C%20b.${entry.hash}.100.webp`,
    ])
    await expect(
      stat(path.join(target.dir, `my post/a, b.${entry.hash}.100.webp`))
    ).resolves.toBeDefined()
  })

  it('skips encoding when the outputs for the content hash exist', async () => {
    const source = await createImage('home.png', { width: 1000, height: 500 })
    const first = await processImage(source, target)
    const files = first.entry.variants.map(variant => outputFile(variant.src))
    const inodes = await Promise.all(files.map(inode))

    const second = await processImage(source, target)

    expect(second.skipped).toBe(true)
    expect(second.entry).toEqual(first.entry)
    expect(await Promise.all(files.map(inode))).toEqual(inodes)

    // Only a missing variant is encoded again.
    const [missing, ...kept] = files
    await rm(missing ?? '')
    const third = await processImage(source, target)

    expect(third.skipped).toBe(false)
    await expect(stat(missing ?? '')).resolves.toBeDefined()
    expect(await Promise.all(kept.map(inode))).toEqual(inodes.slice(1))
  })
})

describe('rejectGif', () => {
  async function createGif(frames: number): Promise<MediaSource> {
    const file = path.join(root, 'media', 'demo.gif')
    await mkdir(path.dirname(file), { recursive: true })
    const pages = await Promise.all(
      Array.from({ length: frames }, (_, index) =>
        sharp({
          create: {
            width: 16,
            height: 16,
            channels: 3,
            background: { r: index * 100, g: 0, b: 0 },
          },
        })
          .png()
          .toBuffer()
      )
    )
    const [first] = pages
    const gif =
      frames > 1 ? sharp(pages, { join: { animated: true } }) : sharp(first)
    await gif.gif().toFile(file)
    return { key: 'demo.gif', file }
  }

  it('rejects an animated GIF and says how to convert it', async () => {
    const source = await createGif(2)

    await expect(rejectGif(source)).rejects.toThrow(
      /Animated GIFs are not supported\. Convert it to MP4 first with `pnpm media:gif2mp4 ".*demo\.gif"`/
    )
  })

  it('rejects a still GIF', async () => {
    const source = await createGif(1)

    await expect(rejectGif(source)).rejects.toThrow(/Save it as PNG instead/)
  })
})
