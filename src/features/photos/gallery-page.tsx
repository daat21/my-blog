import Link from 'next/link'

import { PAGE_GUTTER, WIDE_COLUMN } from '@/components/layout/page-gutter'
import { SiteFooter } from '@/components/layout/site-footer'
import { EmptyState } from '@/components/ui/empty-state'
import { MediaImage } from '@/components/ui/media-image'
import { PageHeader } from '@/components/ui/page-header'
import { SeparatedList } from '@/components/ui/separated-list'
import { listAlbums } from '@/lib/content'

import { AlbumMeta } from './album-meta'
import { PHOTOS_INTRO } from './photos-intro'

/** Album rows grouped by year, newest first. */
export async function GalleryPage() {
  const albums = await listAlbums()
  const years = [...new Set(albums.map(album => album.date.slice(0, 4)))]
  return (
    <div className={PAGE_GUTTER}>
      <div className={WIDE_COLUMN}>
        <PageHeader
          title={PHOTOS_INTRO.title}
          description={PHOTOS_INTRO.description}
        />
        {albums.length === 0 && (
          <EmptyState>No albums yet. Check back soon.</EmptyState>
        )}
        {years.map(year => {
          const entries = albums.filter(album => album.date.startsWith(year))
          return (
            <section
              key={year}
              aria-labelledby={`year-${year}`}
              className="mb-14"
            >
              <div className="flex flex-wrap items-center gap-4 border-b border-border pb-4">
                <h2
                  id={`year-${year}`}
                  className="font-mono text-section text-fg"
                >
                  {year}
                </h2>
                <span className="ml-auto font-mono text-meta text-fg-muted">
                  <SeparatedList
                    items={[
                      `${entries.length} albums`,
                      `${entries.reduce((sum, album) => sum + album.count, 0)} photos`,
                    ]}
                  />
                </span>
              </div>
              <ol>
                {entries.map((album, index) => (
                  <li key={album.slug} className="border-b border-border">
                    <Link
                      href={`/photos/${album.slug}`}
                      className="group grid items-center gap-6 rounded-md py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-10"
                    >
                      <div
                        className="relative aspect-4/3 overflow-hidden rounded-md bg-sunken"
                        style={{ backgroundColor: album.cover.image.color }}
                      >
                        <MediaImage
                          image={album.cover.image}
                          alt={album.cover.alt}
                          sizes="(min-width: 1544px) 408px, (min-width: 1280px) calc((100vw - 484px) / 2.6), (min-width: 1024px) calc((100vw - 412px) / 2.6), (min-width: 768px) calc((100vw - 120px) / 2.6), calc(100vw - 32px)"
                          loading={index === 0 ? 'eager' : 'lazy'}
                          className="absolute inset-0 size-full object-cover"
                        />
                      </div>
                      <div className="flex min-w-0 flex-col gap-3">
                        <h3 className="text-h2 font-semibold text-fg group-hover:text-accent">
                          {album.title}
                        </h3>
                        <AlbumMeta album={album} />
                        <p className="text-body text-fg-body">
                          {album.description}
                        </p>
                        <span className="text-sm font-medium text-accent">
                          View album →
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )
        })}
        <SiteFooter />
      </div>
    </div>
  )
}
