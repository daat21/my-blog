import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getMediaResolver } from '@/lib/media'
import { createLocalMediaResolver } from '@/lib/media/local-media-resolver'
import type { MediaRef } from '@/lib/media/types'

const BASE = '/_media/2026/post'

/** Variants listed out of order, to check that the resolver sorts them. */
const home = {
  kind: 'image',
  hash: 'aaaaaaaaaaaa',
  width: 2400,
  height: 1600,
  variants: [960, 1440, 640].flatMap(width =>
    (['webp', 'avif'] as const).map(format => ({
      format,
      width,
      src: `${BASE}/home.aaaaaaaaaaaa.${width}.${format}`,
    }))
  ),
}

const small = {
  kind: 'image',
  hash: 'bbbbbbbbbbbb',
  width: 800,
  height: 600,
  variants: [640, 800].flatMap(width =>
    (['avif', 'webp'] as const).map(format => ({
      format,
      width,
      src: `${BASE}/small.bbbbbbbbbbbb.${width}.${format}`,
    }))
  ),
}

const clip = {
  kind: 'video',
  hash: 'cccccccccccc',
  width: 1080,
  height: 1920,
  type: 'video/mp4',
  src: `${BASE}/clip.cccccccccccc.mp4`,
}

const MANIFEST = {
  version: 1,
  items: {
    '2026/post/home.png': home,
    '2026/post/small.jpg': small,
    '2026/post/clip.mp4': clip,
  },
}

let dir: string
let manifestPath: string

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'media-resolver-'))
  manifestPath = path.join(dir, 'manifest.json')
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

async function writeManifest(data: unknown): Promise<void> {
  await writeFile(manifestPath, JSON.stringify(data))
}

describe('createLocalMediaResolver', () => {
  it('resolves an image to AVIF and WebP sources with a WebP fallback', async () => {
    await writeManifest(MANIFEST)
    const resolver = createLocalMediaResolver({ manifestPath })

    expect(await resolver.resolve('media:2026/post/home.png')).toEqual({
      kind: 'image',
      width: 2400,
      height: 1600,
      sources: [
        {
          type: 'image/avif',
          srcSet: [
            `${BASE}/home.aaaaaaaaaaaa.640.avif 640w`,
            `${BASE}/home.aaaaaaaaaaaa.960.avif 960w`,
            `${BASE}/home.aaaaaaaaaaaa.1440.avif 1440w`,
          ].join(', '),
        },
        {
          type: 'image/webp',
          srcSet: [
            `${BASE}/home.aaaaaaaaaaaa.640.webp 640w`,
            `${BASE}/home.aaaaaaaaaaaa.960.webp 960w`,
            `${BASE}/home.aaaaaaaaaaaa.1440.webp 1440w`,
          ].join(', '),
        },
      ],
      src: `${BASE}/home.aaaaaaaaaaaa.960.webp`,
    })
  })

  it('falls back to the largest WebP variant when none is 960 wide', async () => {
    await writeManifest(MANIFEST)
    const resolver = createLocalMediaResolver({ manifestPath })

    const resolved = await resolver.resolve('media:2026/post/small.jpg')
    expect(resolved).toMatchObject({
      kind: 'image',
      width: 800,
      height: 600,
      src: `${BASE}/small.bbbbbbbbbbbb.800.webp`,
    })
  })

  it('resolves a video', async () => {
    await writeManifest(MANIFEST)
    const resolver = createLocalMediaResolver({ manifestPath })

    expect(await resolver.resolve('media:2026/post/clip.mp4')).toEqual({
      kind: 'video',
      width: 1080,
      height: 1920,
      sources: [{ type: 'video/mp4', src: `${BASE}/clip.cccccccccccc.mp4` }],
    })
  })

  it.each([
    'media:2026/post/missing.png',
    'media:2026/post/HOME.png',
    'media:constructor',
  ] as const)('rejects the unknown reference %s', async ref => {
    await writeManifest(MANIFEST)
    const resolver = createLocalMediaResolver({ manifestPath })

    await expect(resolver.resolve(ref)).rejects.toThrow(
      `Unknown media reference "${ref}"`
    )
    await expect(resolver.resolve(ref)).rejects.toThrow(/pnpm media:build/)
  })

  it('rejects a reference without the media: prefix', async () => {
    await writeManifest(MANIFEST)
    const resolver = createLocalMediaResolver({ manifestPath })

    await expect(
      resolver.resolve('2026/post/home.png' as MediaRef)
    ).rejects.toThrow(/must start with "media:"/)
  })

  it('explains how to create a missing manifest, and retries later', async () => {
    const resolver = createLocalMediaResolver({ manifestPath })

    await expect(resolver.resolve('media:2026/post/home.png')).rejects.toThrow(
      /Media manifest not found at .*manifest\.json\. Run `pnpm media:build`/
    )

    await writeManifest(MANIFEST)
    await expect(
      resolver.resolve('media:2026/post/home.png')
    ).resolves.toMatchObject({ kind: 'image' })
  })

  it('rejects a manifest that is not JSON', async () => {
    await writeFile(manifestPath, '{ not json')
    const resolver = createLocalMediaResolver({ manifestPath })

    await expect(resolver.resolve('media:2026/post/home.png')).rejects.toThrow(
      /not valid JSON\. Run `pnpm media:build`/
    )
  })

  it('rejects a manifest that fails validation', async () => {
    await writeManifest({ version: 1, items: { 'a.png': { kind: 'image' } } })
    const resolver = createLocalMediaResolver({ manifestPath })

    await expect(resolver.resolve('media:a.png')).rejects.toThrow(
      /Invalid media manifest/
    )
  })

  it('reads the manifest only once', async () => {
    await writeManifest(MANIFEST)
    const resolver = createLocalMediaResolver({ manifestPath })
    await resolver.resolve('media:2026/post/home.png')

    await rm(manifestPath)
    await expect(
      resolver.resolve('media:2026/post/clip.mp4')
    ).resolves.toMatchObject({ kind: 'video' })
  })
})

describe('getMediaResolver', () => {
  it('returns the same resolver every time', () => {
    expect(getMediaResolver()).toBe(getMediaResolver())
  })
})
