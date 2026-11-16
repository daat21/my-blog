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
import type { ImageEntry, ImageVariant } from './manifest.mts'
import {
  IMAGE_ENCODERS as ENCODERS,
  IMAGE_FORMATS as FORMATS,
  IMAGE_WIDTHS,
  MEDIA_RECIPE,
} from './recipe.mts'

export { IMAGE_WIDTHS } from './recipe.mts'

// Settings and codec changes must also invalidate immutable public URLs.
const RECIPE = JSON.stringify(MEDIA_RECIPE)

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

function toHex(channel: number): string {
  return channel.toString(16).padStart(2, '0')
}

/**
 * Returns the most common colour of an image as `#rrggbb`. It is read from
 * a small variant that is already on disk, so an unchanged image costs a
 * quick decode instead of decoding the original on every build.
 */
async function dominantColor(file: string): Promise<string> {
  const { dominant } = await sharp(file).stats()
  return `#${toHex(dominant.r)}${toHex(dominant.g)}${toHex(dominant.b)}`
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
 * Generates AVIF and WebP variants of a PNG, JPEG or WebP image, and finds
 * its dominant colour. Variants that already exist for the same content
 * hash are not encoded again.
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

  // Jobs are narrowest first within each format.
  const smallest = jobs.find(job => job.format === 'webp')
  if (!smallest) throw new Error('No WebP variant was planned.')
  const color = await dominantColor(path.join(target.dir, smallest.name))

  return {
    entry: {
      kind: 'image',
      hash,
      width,
      height,
      color,
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
