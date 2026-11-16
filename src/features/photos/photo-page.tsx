import type { Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { CSSProperties } from 'react'

import {
  PAGE_GUTTER,
  READING_COLUMN,
  WIDE_COLUMN,
} from '@/components/layout/page-gutter'
import { SiteFooter } from '@/components/layout/site-footer'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { MediaImage } from '@/components/ui/media-image'
import { ArticleBody } from '@/features/posts'
import { getAlbum, getPhoto } from '@/lib/content'
import { cn } from '@/lib/utils'

import { ArrowNavigation } from './arrow-navigation'
import { cappedWidth, photoSizes } from './image-sizes'
import { PhotoMeta } from './photo-meta'
import { PhotoNavigation } from './photo-navigation'

/** A stable desktop image frame and sticky details, stacked on smaller screens. */
export async function PhotoPage({
  album: slug,
  slug: photoSlug,
}: {
  album: string
  slug: string
}) {
  const [photo, album] = await Promise.all([
    getPhoto(slug, photoSlug),
    getAlbum(slug),
  ])
  if (!photo || !album) notFound()
  return (
    <div className={cn(PAGE_GUTTER, 'pt-0 md:pt-10')}>
      <div className={WIDE_COLUMN}>
        <ArrowNavigation
          previous={photo.previous && `/photos/${slug}/${photo.previous.slug}`}
          next={photo.next && `/photos/${slug}/${photo.next.slug}`}
        />
        <article className="grid min-w-0 gap-0 md:gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-8">
          <div className="min-w-0">
            <figure className="relative -mx-4 flex items-center justify-center overflow-hidden bg-sunken md:mx-0 md:rounded-md xl:h-[calc(100dvh-10rem)] xl:min-h-80 xl:p-6">
              <div
                className="relative xl:max-w-[var(--photo-width)]"
                style={
                  {
                    width: `min(100%, ${cappedWidth(photo.image)}dvh)`,
                    aspectRatio: `${photo.image.width} / ${photo.image.height}`,
                    backgroundColor: photo.image.color,
                    '--photo-width': `calc((100dvh - 13rem) * ${photo.image.width / photo.image.height})`,
                  } as CSSProperties
                }
              >
                <MediaImage
                  image={photo.image}
                  alt={photo.alt}
                  sizes={photoSizes(photo.image)}
                  loading="eager"
                  fetchPriority="high"
                  className="absolute inset-0 size-full object-contain"
                />
              </div>
            </figure>
            <nav
              aria-label="Photos in this album"
              className="mt-4 hidden overflow-x-auto p-1 xl:block"
            >
              <ol className="flex w-max gap-3">
                {album.photos.map((entry, index) => (
                  <li key={entry.slug}>
                    <Link
                      href={`/photos/${slug}/${entry.slug}`}
                      aria-label={`${index + 1}. ${entry.title}`}
                      aria-current={
                        entry.slug === photoSlug ? 'page' : undefined
                      }
                      className={cn(
                        'relative flex size-14 items-center justify-center overflow-hidden rounded-sm bg-sunken',
                        entry.slug === photoSlug &&
                          'outline-2 outline-offset-2 outline-accent'
                      )}
                      style={{ backgroundColor: entry.image.color }}
                    >
                      <MediaImage
                        image={entry.image}
                        alt=""
                        sizes="56px"
                        className="absolute inset-0 size-full object-contain"
                      />
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          <div
            className={cn(
              READING_COLUMN,
              'flex w-full min-w-0 flex-col gap-6 xl:sticky xl:top-10 xl:self-start'
            )}
          >
            <div className="order-first -mx-4 md:mx-0 xl:order-none xl:row-start-3">
              <PhotoNavigation photo={photo} />
            </div>
            <Breadcrumb
              className="py-2 xl:order-first"
              items={[
                { label: 'photos', href: '/photos' },
                { label: slug, href: `/photos/${slug}` as Route },
                { label: photo.slug },
              ]}
            />
            <header className="flex flex-col gap-3 xl:order-first">
              <h1 className="text-h1 font-semibold tracking-[-0.022em] text-fg xl:text-h2">
                {photo.title}
              </h1>
              {photo.story && <ArticleBody body={photo.story} />}
            </header>
            <PhotoMeta photo={photo} />
          </div>
        </article>
        <SiteFooter />
      </div>
    </div>
  )
}
