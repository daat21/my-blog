import { writeFileAtomic } from './files.mts'

// The site validates this shape with Zod when it reads the manifest, so a
// change here must be matched in src/lib/media/manifest.ts.

export type ImageFormat = 'avif' | 'webp'

export interface ImageVariant {
  format: ImageFormat
  width: number
  src: string
}

export interface ImageEntry {
  kind: 'image'
  /** Hash of the source bytes and the encoder settings. */
  hash: string
  /** Intrinsic size of the original, after EXIF orientation. */
  width: number
  height: number
  /** AVIF first, then WebP; narrowest first within each format. */
  variants: ImageVariant[]
}

export interface VideoEntry {
  kind: 'video'
  /** Hash of the source bytes. */
  hash: string
  width: number
  height: number
  type: 'video/mp4'
  src: string
}

export type MediaEntry = ImageEntry | VideoEntry

export interface MediaManifest {
  version: 1
  /** Keyed by the path below the media root, e.g. `2026/post/home.png`. */
  items: Record<string, MediaEntry>
}

/** Builds a manifest with its items sorted by key, for stable output. */
export function createManifest(
  entries: ReadonlyMap<string, MediaEntry>
): MediaManifest {
  const keys = [...entries.keys()].sort()
  const items: Record<string, MediaEntry> = {}
  for (const key of keys) {
    const entry = entries.get(key)
    if (entry) items[key] = entry
  }
  return { version: 1, items }
}

export async function writeManifest(
  file: string,
  manifest: MediaManifest
): Promise<void> {
  await writeFileAtomic(file, `${JSON.stringify(manifest, null, 2)}\n`)
}
