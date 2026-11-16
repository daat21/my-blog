import type { Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { CSSProperties } from 'react'

import { PAGE_GUTTER, READING_COLUMN } from '@/components/layout/page-gutter'
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
    <div className={PAGE_GUTTER}>
      <ArrowNavigation
        current={`/photos/${slug}/${photo.slug}`}
        previous={photo.previous && `/photos/${slug}/${photo.previous.slug}`}
        next={photo.next && `/photos/${slug}/${photo.next.slug}`}
      />
      <article>
        <header className="mb-6 flex flex-col gap-3">
          <Breadcrumb
            items={[
              { label: 'photos', href: '/photos' },
              { label: slug, href: `/photos/${slug}` as Route },
              { label: photo.slug },
            ]}
          />
          <h1 className="text-h1 font-semibold tracking-[-0.022em] text-fg xl:text-h2">
            {photo.title}
          </h1>
        </header>
        <div className="flex min-w-0 flex-col gap-6 xl:flex-row xl:gap-8">
          <div className="min-w-0 flex-1">
            <figure className="relative -mx-4 flex items-center justify-center overflow-hidden bg-sunken md:mx-0 md:rounded-md xl:h-[calc(100dvh-17rem)] xl:min-h-80 xl:p-6">
              <div
                className="relative w-[min(100%,var(--photo-width))] xl:w-full xl:max-w-[var(--frame-photo-width)]"
                style={
                  {
                    '--photo-width': `${cappedWidth(photo.image)}dvh`,
                    aspectRatio: `${photo.image.width} / ${photo.image.height}`,
                    backgroundColor: photo.image.color,
                    '--frame-photo-width': `calc((max(20rem, 100dvh - 17rem) - 3rem) * ${photo.image.width / photo.image.height})`,
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
              <PhotoNavigation photo={photo} layout="frame" />
            </figure>
            <div className="-mx-4 md:mx-0 xl:hidden">
              <PhotoNavigation photo={photo} layout="stacked" />
            </div>
            <output
              aria-label="Photo position"
              className="mt-4 hidden text-center font-mono text-meta text-fg-muted xl:block"
            >
              <span className="text-fg">{photo.position}</span> /{' '}
              {photo.album.count}
            </output>
            <nav
              aria-label="Photos in this album"
              className="mt-3 hidden overflow-x-auto p-1 xl:block"
            >
              <ol className="mx-auto flex w-max gap-3">
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
          <section
            aria-label="Photo details"
            className={cn(
              READING_COLUMN,
              'flex w-full min-w-0 flex-col gap-6 xl:sticky xl:top-10 xl:mx-0 xl:w-75 xl:shrink-0 xl:self-start'
            )}
          >
            {photo.story && <ArticleBody body={photo.story} />}
            <PhotoMeta photo={photo} />
          </section>
        </div>
      </article>
      <SiteFooter />
    </div>
  )
}
