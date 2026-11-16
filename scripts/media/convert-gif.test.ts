import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { convertGifToMp4, defaultMp4Path, ffmpegArgs } from './convert-gif.mts'
import { readMp4Dimensions } from './mp4-dimensions.mts'

const hasFfmpeg =
  spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'media-gif-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

/** Writes a two-frame animated GIF with odd dimensions. */
async function createGif(name = 'demo.gif'): Promise<string> {
  const frames = await Promise.all(
    [0, 255].map(red =>
      sharp({
        create: {
          width: 33,
          height: 21,
          channels: 3,
          background: { r: red, g: 0, b: 0 },
        },
      })
        .png()
        .toBuffer()
    )
  )
  const file = path.join(dir, name)
  await sharp(frames, { join: { animated: true } })
    .gif()
    .toFile(file)
  return file
}

/** Returns the value that follows `flag` in `args`. */
function option(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag)
  return index === -1 ? undefined : args[index + 1]
}

describe('defaultMp4Path', () => {
  it.each([
    ['media/2026/demo.gif', 'media/2026/demo.mp4'],
    ['DEMO.GIF', 'DEMO.mp4'],
    ['/abs/my clip.gif', '/abs/my clip.mp4'],
  ])('maps %s to %s', (input, expected) => {
    expect(defaultMp4Path(input)).toBe(expected)
  })
})

describe('ffmpegArgs', () => {
  const args = ffmpegArgs('/in/demo.gif', '/out/demo.mp4')

  it('encodes H.264 in yuv420p with even dimensions', () => {
    expect(option(args, '-i')).toBe('/in/demo.gif')
    expect(option(args, '-c:v')).toBe('libx264')
    expect(option(args, '-pix_fmt')).toBe('yuv420p')
    expect(option(args, '-vf')).toBe(
      'scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1'
    )
  })

  it('drops audio, moves the index to the front and never overwrites', () => {
    expect(args).toContain('-an')
    expect(option(args, '-movflags')).toBe('+faststart')
    expect(args).toContain('-n')
    expect(args.at(-1)).toBe('/out/demo.mp4')
  })
})

describe('convertGifToMp4', () => {
  it('rejects an input that is not a GIF', async () => {
    await expect(
      convertGifToMp4(path.join(dir, 'a.png'), path.join(dir, 'a.mp4'))
    ).rejects.toThrow(/Expected a \.gif file/)
  })

  it('rejects an output that is not an MP4', async () => {
    await expect(
      convertGifToMp4(path.join(dir, 'a.gif'), path.join(dir, 'a.webm'))
    ).rejects.toThrow(/must be an \.mp4 file/)
  })

  it('rejects a missing input', async () => {
    await expect(
      convertGifToMp4(path.join(dir, 'missing.gif'), path.join(dir, 'a.mp4'))
    ).rejects.toThrow(/missing\.gif does not exist/)
  })

  it('refuses to overwrite an existing output', async () => {
    const input = await createGif()
    const output = path.join(dir, 'demo.mp4')
    await writeFile(output, 'keep me')

    await expect(convertGifToMp4(input, output)).rejects.toThrow(
      /already exists/
    )
    expect(await readFile(output, 'utf8')).toBe('keep me')
  })

  it('explains how to install ffmpeg when it is missing', async () => {
    const input = await createGif()

    await expect(
      convertGifToMp4(input, path.join(dir, 'demo.mp4'), {
        ffmpeg: path.join(dir, 'no-such-ffmpeg'),
      })
    ).rejects.toThrow(/ffmpeg is not installed or not on your PATH/)
  })

  it.skipIf(!hasFfmpeg)(
    'writes an MP4 with even dimensions and square pixels',
    async () => {
      // ffmpeg marks its own GIFs as square-pixel, which is the case where
      // rounding to even dimensions would otherwise change the aspect ratio.
      const input = path.join(dir, 'demo.gif')
      const made = spawnSync('ffmpeg', [
        ...['-hide_banner', '-loglevel', 'error', '-f', 'lavfi'],
        ...['-i', 'testsrc=size=33x21:rate=5:duration=0.6', input],
      ])
      expect(made.status).toBe(0)
      const output = path.join(dir, 'demo.mp4')

      await convertGifToMp4(input, output)

      expect(readMp4Dimensions(await readFile(output))).toEqual({
        width: 32,
        height: 20,
      })
    },
    20_000
  )
})
