import sharp from 'sharp'

/** Target widths, narrowest first; never upscale the source. */
export const IMAGE_WIDTHS = [640, 960, 1440, 2048] as const

export const IMAGE_FORMATS = ['avif', 'webp'] as const

export const IMAGE_ENCODERS = {
  avif: { quality: 50, effort: 4 },
  webp: { quality: 75, effort: 4 },
} as const

/** Bump pipelineVersion when processing or manifest semantics change. */
export const MEDIA_RECIPE = {
  pipelineVersion: 1,
  widths: IMAGE_WIDTHS,
  formats: IMAGE_FORMATS,
  encoders: IMAGE_ENCODERS,
  // Include native codec versions as well as sharp itself.
  sharp: sharp.versions,
} as const
