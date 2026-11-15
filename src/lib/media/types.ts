/** A logical reference to a media file, e.g. `media:2026/starting-over/home.png`. */
export type MediaRef = `media:${string}`

export interface ImageSource {
  type: 'image/avif' | 'image/webp'
  /** Comma-separated `url width` candidates, ready for `<source srcset>`. */
  srcSet: string
}

export interface ResolvedImage {
  kind: 'image'
  width: number
  height: number
  /** Modern formats, best first, for `<picture>`. */
  sources: ImageSource[]
  /** Fallback for `<img src>`. */
  src: string
  /** The most common colour as `#rrggbb`, to show while the image loads. */
  color?: string
}

export interface VideoSource {
  type: 'video/mp4' | 'video/webm'
  src: string
}

export interface ResolvedVideo {
  kind: 'video'
  width: number
  height: number
  sources: VideoSource[]
  poster?: string
}

export type ResolvedMedia = ResolvedImage | ResolvedVideo

/** Turns logical media references into URLs and dimensions. */
export interface MediaResolver {
  /** Throws if the reference does not exist. */
  resolve(ref: MediaRef): Promise<ResolvedMedia>
}
