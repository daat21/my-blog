import { readFile } from 'node:fs/promises'

import { parseMediaManifest } from '@/lib/media/manifest'
import type {
  ImageManifestEntry,
  MediaManifestEntry,
  VideoManifestEntry,
} from '@/lib/media/manifest'
import type {
  ImageSource,
  MediaRef,
  MediaResolver,
  ResolvedImage,
  ResolvedVideo,
} from '@/lib/media/types'

const MEDIA_PREFIX = 'media:'

/** Image formats in `<picture>` order, best first. */
const IMAGE_FORMATS = ['avif', 'webp'] as const

/** `<img src>` uses the largest WebP variant up to this width. */
const FALLBACK_MAX_WIDTH = 960

export interface LocalMediaResolverOptions {
  /** Absolute path of the manifest written by `pnpm media:build`. */
  manifestPath: string
}

type ManifestEntries = ReadonlyMap<string, MediaManifestEntry>

function isNotFound(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

async function loadManifest(manifestPath: string): Promise<ManifestEntries> {
  let text: string
  try {
    text = await readFile(manifestPath, 'utf8')
  } catch (error) {
    if (isNotFound(error)) {
      throw new Error(
        `Media manifest not found at ${manifestPath}. ` +
          'Run `pnpm media:build` to process the media files and write it.',
        { cause: error }
      )
    }
    throw error
  }

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    throw new Error(
      `Media manifest at ${manifestPath} is not valid JSON. ` +
        'Run `pnpm media:build` to regenerate it.',
      { cause: error }
    )
  }
  // A Map, so that refs such as `media:constructor` cannot hit
  // Object.prototype.
  return new Map(Object.entries(parseMediaManifest(data, manifestPath).items))
}

function toResolvedImage(
  ref: MediaRef,
  entry: ImageManifestEntry
): ResolvedImage {
  const variantsOf = (format: (typeof IMAGE_FORMATS)[number]) =>
    entry.variants
      .filter(variant => variant.format === format)
      .toSorted((a, b) => a.width - b.width)

  const sources: ImageSource[] = []
  for (const format of IMAGE_FORMATS) {
    const variants = variantsOf(format)
    if (variants.length === 0) continue
    sources.push({
      type: `image/${format}`,
      srcSet: variants
        .map(variant => `${variant.src} ${variant.width}w`)
        .join(', '),
    })
  }

  const webp = variantsOf('webp')
  const fallback =
    webp.findLast(variant => variant.width <= FALLBACK_MAX_WIDTH) ?? webp[0]
  // The manifest schema requires a WebP variant, so this only guards
  // against the schema and this code drifting apart.
  if (!fallback) throw new Error(`No WebP variant for "${ref}".`)

  return {
    kind: 'image',
    width: entry.width,
    height: entry.height,
    sources,
    src: fallback.src,
    ...(entry.color !== undefined && { color: entry.color }),
  }
}

function toResolvedVideo(entry: VideoManifestEntry): ResolvedVideo {
  return {
    kind: 'video',
    width: entry.width,
    height: entry.height,
    sources: [{ type: entry.type, src: entry.src }],
  }
}

/**
 * Resolves media from the manifest that `pnpm media:build` writes. The
 * manifest is read and validated on first use and then kept in memory.
 */
export function createLocalMediaResolver({
  manifestPath,
}: LocalMediaResolverOptions): MediaResolver {
  let entries: Promise<ManifestEntries> | undefined

  const load = (): Promise<ManifestEntries> =>
    (entries ??= loadManifest(manifestPath).catch((error: unknown) => {
      // Forget the failure so that a later call can pick up a manifest
      // written in the meantime.
      entries = undefined
      throw error
    }))

  return {
    async resolve(ref) {
      if (!ref.startsWith(MEDIA_PREFIX)) {
        throw new Error(
          `Invalid media reference "${ref}": it must start with "${MEDIA_PREFIX}".`
        )
      }
      const path = ref.slice(MEDIA_PREFIX.length)
      const entry = (await load()).get(path)
      if (!entry) {
        throw new Error(
          `Unknown media reference "${ref}": media/${path} does not exist in ` +
            'the content directory, or was added after the media manifest was ' +
            'built. Check the path, then run `pnpm media:build`.'
        )
      }
      return entry.kind === 'image'
        ? toResolvedImage(ref, entry)
        : toResolvedVideo(entry)
    },
  }
}
