import { readFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'
import type { Sharp } from 'sharp'

import {
  contentHash,
  fileExists,
  outputName,
  publicUrl,
  writeFileAtomic,
} from './files.mts'
import type { MediaSource, OutputTarget, ProcessedMedia } from './files.mts'
import type { ImageEntry, ImageFormat, ImageVariant } from './manifest.mts'

/** Target widths in CSS pixels, narrowest first. */
export const IMAGE_WIDTHS = [640, 960, 1440] as const

/** Output formats, best first. */
const FORMATS = ['avif', 'webp'] as const satisfies ImageFormat[]

const ENCODERS = {
  avif: { quality: 50, effort: 4 },
  webp: { quality: 75, effort: 4 },
} as const satisfies Record<ImageFormat, { quality: number; effort: number }>

// Hashed together with the source bytes, so that changing a setting gives
// every image new file names instead of serving stale cached variants.
const RECIPE = JSON.stringify({ widths: IMAGE_WIDTHS, encoders: ENCODERS })

/**
 * Returns the widths to generate for an image `originalWidth` pixels wide:
 * the target widths, capped at the original so that nothing is upscaled.
 * There is always at least one.
 */
export function planImageWidths(originalWidth: number): number[] {
  const capped = IMAGE_WIDTHS.map(width => Math.min(width, originalWidth))
  return [...new Set(capped)]
}

interface Job extends ImageVariant {
  /** Output path relative to the output directory. */
  name: string
}

async function encode(
  image: Sharp,
  job: Job,
  target: OutputTarget
): Promise<void> {
  const resized = image
    .clone()
    .resize({ width: job.width, withoutEnlargement: true })
  const data = await (
    job.format === 'avif'
      ? resized.avif(ENCODERS.avif)
      : resized.webp(ENCODERS.webp)
  ).toBuffer()
  await writeFileAtomic(path.join(target.dir, job.name), data)
}

/**
 * Generates AVIF and WebP variants of a PNG, JPEG or WebP image. Variants
 * that already exist for the same content hash are not encoded again.
 */
export async function processImage(
  source: MediaSource,
  target: OutputTarget
): Promise<ProcessedMedia<ImageEntry>> {
  const input = await readFile(source.file)
  const hash = contentHash(RECIPE, '\0', input)
  // Rotated JPEGs report their stored size; autoOrient is the displayed one.
  const { width, height } = (await sharp(input).metadata()).autoOrient

  const jobs: Job[] = FORMATS.flatMap(format =>
    planImageWidths(width).map(variantWidth => {
      const name = outputName(source.key, hash, `${variantWidth}.${format}`)
      return { format, width: variantWidth, name, src: publicUrl(target, name) }
    })
  )

  const exists = await Promise.all(
    jobs.map(job => fileExists(path.join(target.dir, job.name)))
  )
  const missing = jobs.filter((_, index) => !exists[index])
  if (missing.length > 0) {
    const image = sharp(input, { autoOrient: true })
    await Promise.all(missing.map(job => encode(image, job, target)))
  }

  return {
    entry: {
      kind: 'image',
      hash,
      width,
      height,
      variants: jobs.map(({ format, width, src }) => ({ format, width, src })),
    },
    outputs: jobs.map(job => job.name),
    skipped: missing.length === 0,
  }
}

/**
 * Rejects a GIF. Animated GIFs are far larger than the same clip as MP4,
 * so they must be converted before publishing.
 */
export async function rejectGif(source: MediaSource): Promise<never> {
  const { pages = 1 } = await sharp(source.file).metadata()
  if (pages > 1) {
    throw new Error(
      'Animated GIFs are not supported. Convert it to MP4 first with ' +
        `\`pnpm media:gif2mp4 ${JSON.stringify(source.file)}\`, then embed ` +
        'the .mp4 file as a video.'
    )
  }
  throw new Error('GIF images are not supported. Save it as PNG instead.')
}
