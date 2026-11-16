import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import sharp from 'sharp'
import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest'

// The site reads what this script writes, so check the output against the
// site's own schema and resolver.
import { createLocalMediaResolver } from '@/lib/media/local-media-resolver'
import { parseMediaManifest } from '@/lib/media/manifest'

import { processImage } from './image.mts'
import type * as ImageModule from './image.mts'
import { buildMedia } from './pipeline.mts'

vi.mock('./image.mts', async importOriginal => {
  const actual = await importOriginal<typeof ImageModule>()
  return { ...actual, processImage: vi.fn(actual.processImage) }
})
import type { BuildMediaResult } from './pipeline.mts'

const VIDEO_FIXTURE = new URL('fixtures/video-48x32.mp4', import.meta.url)
const HOME = '2026/post/home.png'
const CLIP = '2026/post/clip.mp4'

let root: string
let mediaRoot: string
let outputDir: string
let manifestPath: string
let messages: string[]

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'media-pipeline-'))
  mediaRoot = path.join(root, 'content', 'media')
  outputDir = path.join(root, 'public', '_media')
  manifestPath = path.join(root, '.media', 'manifest.json')
  messages = []
  vi.mocked(processImage).mockClear()
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

function build(cacheDir?: string): Promise<BuildMediaResult> {
  return buildMedia({
    mediaRoot,
    output: { dir: outputDir, publicPath: '/_media' },
    manifestPath,
    cacheDir,
    log: message => messages.push(message),
  })
}

async function writeSource(key: string, data: string | Uint8Array) {
  const file = path.join(mediaRoot, key)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, data)
}

async function png(width: number, height: number, red = 200) {
  return sharp({
    create: { width, height, channels: 3, background: { r: red, g: 0, b: 0 } },
  })
    .png()
    .toBuffer()
}

async function addVideo(key: string) {
  await mkdir(path.dirname(path.join(mediaRoot, key)), { recursive: true })
  await copyFile(VIDEO_FIXTURE, path.join(mediaRoot, key))
}

/** Lists the files below `dir`, relative to it. */
async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true })
  return entries
    .filter(entry => entry.isFile())
    .map(entry => path.relative(dir, path.join(entry.parentPath, entry.name)))
    .sort()
}

describe('buildMedia', () => {
  it('processes images and videos into a manifest the site can read', async () => {
    await writeSource(HOME, await png(1600, 900))
    await addVideo(CLIP)
    await writeSource('.DS_Store', 'ignored')
    await writeSource('2026/.drafts/secret.png', await png(10, 10))

    const result = await build()

    expect(result.processed).toEqual([CLIP, HOME])
    expect(result.skipped).toEqual([])
    expect(Object.keys(result.manifest.items)).toEqual([CLIP, HOME])
    const clip = result.manifest.items[CLIP]
    assert(clip?.kind === 'video')
    expect(clip.hash).toMatch(/^[0-9a-f]{12}$/)
    expect(clip).toEqual({
      kind: 'video',
      hash: clip.hash,
      width: 48,
      height: 32,
      type: 'video/mp4',
      src: `/_media/2026/post/clip.${clip.hash}.mp4`,
    })

    const written: unknown = JSON.parse(await readFile(manifestPath, 'utf8'))
    expect(written).toEqual(result.manifest)
    expect(parseMediaManifest(written, manifestPath)).toEqual(result.manifest)

    const resolver = createLocalMediaResolver({ manifestPath })
    const image = await resolver.resolve(`media:${HOME}`)
    const video = await resolver.resolve(`media:${CLIP}`)
    expect(image).toMatchObject({
      kind: 'image',
      width: 1600,
      height: 900,
      color: '#c80808',
    })
    expect(video).toMatchObject({ kind: 'video', width: 48, height: 32 })

    // Every URL the resolver hands out points at a generated file.
    assert(image.kind === 'image' && video.kind === 'video')
    const urls = [
      image.src,
      ...image.sources.flatMap(source =>
        source.srcSet.split(', ').map(candidate => candidate.split(' ')[0])
      ),
      ...video.sources.map(source => source.src),
    ]
    // Four widths in two formats for the 1600 px image, and the clip.
    const generated = await listFiles(outputDir)
    expect(generated).toHaveLength(9)
    for (const url of urls) {
      expect(generated).toContain(url?.replace('/_media/', ''))
    }
    const copy = generated.find(file => file.endsWith('.mp4')) ?? ''
    expect(await readFile(path.join(outputDir, copy))).toEqual(
      await readFile(VIDEO_FIXTURE)
    )
  })

  it('skips files whose outputs are up to date', async () => {
    await writeSource(HOME, await png(800, 600))
    await addVideo(CLIP)
    const first = await build()

    const second = await build()

    expect(second.processed).toEqual([])
    expect(second.skipped).toEqual([CLIP, HOME])
    expect(second.removed).toEqual([])
    expect(second.manifest).toEqual(first.manifest)
  })

  it('restores byte-identical outputs and metadata without decoding on cache hits', async () => {
    const cacheDir = path.join(root, 'cache')
    await writeSource(HOME, await png(800, 600))
    await addVideo(CLIP)
    const uncached = await build()
    const manifestBytes = await readFile(manifestPath)
    const names = await listFiles(outputDir)
    const bytes = await Promise.all(
      names.map(name => readFile(path.join(outputDir, name)))
    )

    await rm(outputDir, { recursive: true })
    const cold = await build(cacheDir)
    expect(cold.processed).toEqual([CLIP, HOME])
    expect(cold.manifest).toEqual(uncached.manifest)
    vi.mocked(processImage).mockClear()
    await rm(outputDir, { recursive: true })
    await rm(manifestPath)

    const warm = await build(cacheDir)

    expect(processImage).not.toHaveBeenCalled()
    expect(warm.processed).toEqual([])
    expect(warm.skipped).toEqual([CLIP, HOME])
    expect(await readFile(manifestPath)).toEqual(manifestBytes)
    expect(await listFiles(outputDir)).toEqual(names)
    expect(
      await Promise.all(names.map(name => readFile(path.join(outputDir, name))))
    ).toEqual(bytes)
  })

  it('misses on changed bytes and prunes changed and deleted cache entries', async () => {
    const cacheDir = path.join(root, 'cache')
    await writeSource(HOME, await png(80, 60))
    await addVideo(CLIP)
    await build(cacheDir)
    const oldKeys = await readdir(cacheDir)
    expect(oldKeys).toHaveLength(2)

    await writeSource(HOME, await png(80, 60, 10))
    await rm(path.join(mediaRoot, CLIP))
    const changed = await build(cacheDir)
    expect(changed.processed).toEqual([HOME])
    const keys = await readdir(cacheDir)
    expect(keys).toHaveLength(1)
    expect(oldKeys).not.toContain(keys[0])

    await rm(path.join(mediaRoot, HOME))
    await build(cacheDir)
    expect(await readdir(cacheDir)).toEqual([])
  })

  it('rebuilds incomplete or malformed cache entries', async () => {
    const cacheDir = path.join(root, 'cache')
    await writeSource(HOME, await png(80, 60))
    await build(cacheDir)
    const [key = ''] = await readdir(cacheDir)
    const entryDir = path.join(cacheDir, key)
    const [name = ''] = await listFiles(path.join(entryDir, 'files'))
    await rm(path.join(entryDir, 'files', name))
    expect((await build(cacheDir)).processed).toEqual([HOME])
    expect(await readFile(path.join(entryDir, 'files', name))).toEqual(
      await readFile(path.join(outputDir, name))
    )

    for (const invalid of [
      'not json',
      '{}',
      JSON.stringify({
        entry: (await build(cacheDir)).manifest.items[HOME],
        outputs: ['../escape.webp'],
      }),
    ]) {
      await writeFile(path.join(entryDir, 'entry.json'), invalid)
      expect((await build(cacheDir)).processed).toEqual([HOME])
    }
    expect((await build(cacheDir)).skipped).toEqual([HOME])
  })

  it('does not prune the last successful cache on a failed build', async () => {
    const cacheDir = path.join(root, 'cache')
    await writeSource(HOME, await png(80, 60))
    await build(cacheDir)
    const keys = await readdir(cacheDir)
    await rm(path.join(mediaRoot, HOME))
    await writeSource('broken.png', 'not an image')
    await expect(build(cacheDir)).rejects.toThrow('Could not process')
    expect(await readdir(cacheDir)).toEqual(keys)
  })

  it('replaces the outputs of a changed file and removes the old ones', async () => {
    await writeSource(HOME, await png(800, 600))
    await build()
    const old = await listFiles(outputDir)

    await writeSource(HOME, await png(800, 600, 10))
    const result = await build()

    expect(result.processed).toEqual([HOME])
    expect(result.removed).toEqual(old)
    const current = await listFiles(outputDir)
    expect(current).toHaveLength(old.length)
    expect(current.some(file => old.includes(file))).toBe(false)
  })

  it('removes the outputs and folders of deleted files', async () => {
    await writeSource(HOME, await png(800, 600))
    await build()

    await rm(path.join(mediaRoot, HOME))
    const result = await build()

    expect(result.manifest).toEqual({ version: 1, items: {} })
    expect(result.removed).toHaveLength(4)
    expect(await readdir(outputDir)).toEqual([])
  })

  it('writes an empty manifest when there is no media folder', async () => {
    const result = await build()

    expect(result.manifest).toEqual({ version: 1, items: {} })
    expect(JSON.parse(await readFile(manifestPath, 'utf8'))).toEqual({
      version: 1,
      items: {},
    })
    expect(messages).toEqual([
      `No media folder at ${mediaRoot}; nothing to process.`,
    ])
  })

  it('reports every file it cannot process, and writes no manifest', async () => {
    const frames = await Promise.all([png(8, 8, 0), png(8, 8, 255)])
    await writeSource(
      'anim.gif',
      await sharp(frames, { join: { animated: true } })
        .gif()
        .toBuffer()
    )
    await writeSource('broken.png', 'not an image')
    await writeSource('clip.mp4', 'not a video')
    await writeSource('readme.txt', 'hello')
    await writeSource('fine.png', await png(10, 10))

    const error = await build().then(
      () => new Error('expected the build to fail'),
      (reason: unknown) => reason
    )

    expect(error).toBeInstanceOf(Error)
    const message = error instanceof Error ? error.message : ''
    expect(message).toContain('Could not process 4 of 5 media files')
    expect(message).toMatch(
      /media\/anim\.gif: Animated GIFs are not supported\..*pnpm media:gif2mp4/
    )
    expect(message).toContain('media/broken.png: ')
    expect(message).toContain('media/clip.mp4: Malformed MP4')
    expect(message).toContain(
      'media/readme.txt: Unsupported file type. Supported types: .png, .jpg, .jpeg, .webp, .mp4.'
    )
    expect(message).not.toContain('fine.png')
    await expect(stat(manifestPath)).rejects.toThrow(/ENOENT/)
  })
})
