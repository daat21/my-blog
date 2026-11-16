import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { listAlbums, type AlbumSummary } from '@/lib/content'

import { GalleryPage } from './gallery-page'

vi.mock('@/lib/content', () => ({ listAlbums: vi.fn() }))
vi.mock('@/components/layout/site-footer', () => ({ SiteFooter: () => null }))

// A single-album year is not present in the example content.
const album: AlbumSummary = {
  slug: 'a-walk',
  title: 'A walk',
  description: 'Light along the shore.',
  date: '2026-11-08',
  draft: false,
  count: 1,
  cover: {
    slug: 'sun',
    title: 'Low sun',
    alt: 'A sunset over still water.',
    draft: false,
    image: {
      kind: 'image',
      width: 640,
      height: 480,
      src: '/sun.webp',
      sources: [],
    },
  },
}

describe('GalleryPage count labels', () => {
  it.each([1, 2])('renders one album containing %i photos', async count => {
    vi.mocked(listAlbums).mockResolvedValue([{ ...album, count }])
    const html = renderToStaticMarkup(await GalleryPage())
    const text = html.replace(/<[^>]*>/g, '')

    expect(text).toContain(
      `1 album · ${count} ${count === 1 ? 'photo' : 'photos'}`
    )
    expect(text).not.toContain('1 albums')
    expect(text).not.toContain('1 photos')
    // The same photo label also appears in the album row's shared meta.
    expect(text.match(new RegExp(`${count} photos?`, 'g'))).toHaveLength(2)
  })
})
