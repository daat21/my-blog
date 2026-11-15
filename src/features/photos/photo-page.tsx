import { notFound } from 'next/navigation'

import {
  PAGE_GUTTER,
  READING_COLUMN,
  WIDE_COLUMN,
} from '@/components/layout/page-gutter'
import { MediaImage } from '@/components/ui/media-image'
import { ArticleBody } from '@/features/posts'
import { getPhoto, listPhotos } from '@/lib/content'
import { findNeighbours } from '@/lib/utils'

import { cappedWidth, photoSizes } from './image-sizes'
import { PhotoFooter } from './photo-footer'
import { PhotoMeta } from './photo-meta'

interface PhotoPageProps {
  slug: string
}

/**
 * One photo, as large as the viewport allows: the full width of a column
 * of up to 1100px, but never taller than 80% of the viewport. Below it, in
 * the reading column, come the title, the details, the optional story and
 * links to the neighbouring photos. Unknown slugs, and drafts where drafts
 * are hidden, are a 404.
 */
export async function PhotoPage({ slug }: PhotoPageProps) {
  const [photo, photos] = await Promise.all([getPhoto(slug), listPhotos()])
  if (!photo) notFound()

  const { image } = photo

  return (
    <div className={PAGE_GUTTER}>
      <article className={WIDE_COLUMN}>
        {/* Sized from the photo's dimensions, so nothing moves as it loads;
            the dominant colour fills the box until then. */}
        <div
          className="relative mx-auto overflow-hidden rounded-md bg-sunken"
          style={{
            width: `min(100%, ${cappedWidth(image)}dvh)`,
            aspectRatio: `${image.width} / ${image.height}`,
            backgroundColor: image.color,
          }}
        >
          <MediaImage
            image={image}
            alt={photo.alt}
            sizes={photoSizes(image)}
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 size-full object-contain"
          />
        </div>
        <div className={READING_COLUMN}>
          <header className="mt-8 mb-10 flex flex-col gap-3.5 md:mt-10">
            <h1 className="text-h1 font-semibold tracking-[-0.022em] text-balance text-fg">
              {photo.title}
            </h1>
            <PhotoMeta photo={photo} />
          </header>
          {photo.story && <ArticleBody body={photo.story} />}
          <PhotoFooter neighbours={findNeighbours(photos, photo.slug)} />
        </div>
      </article>
    </div>
  )
}
