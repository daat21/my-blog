import { z } from 'zod'

// The manifest is written by `pnpm media:build`. It lists every file under
// the content directory's media/ folder, keyed by its path there, with the
// URLs and sizes of the generated variants.

/** A public URL that is safe to place in a `srcset` candidate list. */
const url = z
  .string()
  .regex(/^[^\s,]+$/, 'must be a URL without whitespace or commas')

const dimension = z.int().positive()

const hash = z.string().regex(/^[0-9a-f]+$/, 'must be a lowercase hex string')

const imageVariantSchema = z.object({
  format: z.enum(['avif', 'webp']),
  width: dimension,
  src: url,
})

const imageEntrySchema = z.object({
  kind: z.literal('image'),
  hash,
  /** Intrinsic size of the original, after EXIF orientation. */
  width: dimension,
  height: dimension,
  variants: z
    .array(imageVariantSchema)
    .refine(
      variants => variants.some(variant => variant.format === 'webp'),
      'must include at least one WebP variant for the fallback'
    ),
})

const videoEntrySchema = z.object({
  kind: z.literal('video'),
  hash,
  width: dimension,
  height: dimension,
  type: z.literal('video/mp4'),
  src: url,
})

const mediaEntrySchema = z.discriminatedUnion('kind', [
  imageEntrySchema,
  videoEntrySchema,
])

export const mediaManifestSchema = z.object({
  version: z.literal(1),
  /** Keyed by the path below media/, e.g. `2026/starting-over/home.png`. */
  items: z.record(z.string().min(1), mediaEntrySchema),
})

export type MediaManifest = z.infer<typeof mediaManifestSchema>
export type MediaManifestEntry = z.infer<typeof mediaEntrySchema>
export type ImageManifestEntry = z.infer<typeof imageEntrySchema>
export type VideoManifestEntry = z.infer<typeof videoEntrySchema>

/** Validates parsed manifest JSON; `source` names the file in errors. */
export function parseMediaManifest(
  data: unknown,
  source: string
): MediaManifest {
  const result = mediaManifestSchema.safeParse(data)
  if (!result.success) {
    throw new Error(
      `Invalid media manifest at ${source}:\n${z.prettifyError(result.error)}\n` +
        'Run `pnpm media:build` to regenerate it.'
    )
  }
  return result.data
}
