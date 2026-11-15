/**
 * The parts of a resolved image this component reads. Declared here rather
 * than imported because UI primitives do not depend on lib/media; a
 * `ResolvedImage` fits it as is.
 */
export interface MediaImageData {
  width: number
  height: number
  /** Modern formats, best first. */
  sources: readonly { type: string; srcSet: string }[]
  /** Fallback for browsers that support none of the sources. */
  src: string
}

interface MediaImageProps {
  image: MediaImageData
  /** Empty only when the image is decorative. */
  alt: string
  /** How wide the image is laid out, so the browser picks a variant. */
  sizes: string
  loading?: 'lazy' | 'eager'
  /** Classes for the <img>. */
  className?: string
}

/** A processed image as <picture>, one <source> per format. */
export function MediaImage({
  image,
  alt,
  sizes,
  loading = 'lazy',
  className,
}: MediaImageProps) {
  return (
    <picture>
      {image.sources.map(source => (
        <source
          key={source.type}
          type={source.type}
          srcSet={source.srcSet}
          sizes={sizes}
        />
      ))}
      <img
        src={image.src}
        alt={alt}
        width={image.width}
        height={image.height}
        loading={loading}
        decoding="async"
        className={className}
      />
    </picture>
  )
}
