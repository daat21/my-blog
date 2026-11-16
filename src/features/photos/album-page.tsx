import { notFound } from 'next/navigation'

import {
  PAGE_GUTTER,
  READING_COLUMN,
  WIDE_COLUMN,
} from '@/components/layout/page-gutter'
import { SiteFooter } from '@/components/layout/site-footer'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { LinkCard } from '@/components/ui/link-card'
import { ArticleBody } from '@/features/posts'
import { getAlbum, listAlbums } from '@/lib/content'

import { AlbumMeta } from './album-meta'
import { PhotoGrid } from './photo-grid'

/** An album's introduction, ordered masonry and next older album. */
export async function AlbumPage({ slug }: { slug: string }) {
  const [album, albums] = await Promise.all([getAlbum(slug), listAlbums()])
  if (!album) notFound()
  const older = albums[albums.findIndex(entry => entry.slug === slug) + 1]
  return (
    <div className={PAGE_GUTTER}>
      <div className={WIDE_COLUMN}>
        <Breadcrumb
          items={[{ label: 'photos', href: '/photos' }, { label: slug }]}
        />
        <header className="mt-7 mb-10 flex flex-col gap-4 border-b border-border pb-8">
          <h1 className="text-h1 font-semibold tracking-[-0.022em] text-fg">
            {album.title}
          </h1>
          <AlbumMeta album={album} />
          <p className="max-w-172.5 text-body text-fg-body">
            {album.description}
          </p>
          {album.intro && (
            <div className={`${READING_COLUMN} w-full`}>
              <ArticleBody body={album.intro} />
            </div>
          )}
        </header>
        <PhotoGrid album={slug} photos={album.photos} />
        <nav
          aria-label="More albums"
          className="mt-14 grid gap-3 md:grid-cols-2"
        >
          <LinkCard href="/photos" label="← all albums" title="Photos" />
          {older && (
            <LinkCard
              href={`/photos/${older.slug}`}
              align="end"
              label="older album →"
              title={older.title}
            />
          )}
        </nav>
        <SiteFooter />
      </div>
    </div>
  )
}
