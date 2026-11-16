import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getAlbum,
  getPhoto,
  listAlbums,
  type AlbumSummary,
  type PhotoSummary,
} from '@/lib/content'

import {
  albumMetadata,
  albumStaticParams,
  photoMetadata,
  photoStaticParams,
} from './metadata'

vi.mock('@/lib/content', async () => {
  const { staticParams } = await import('@/lib/content/static-params')
  return {
    staticParams,
    listAlbums: vi.fn(),
    getAlbum: vi.fn(),
    getPhoto: vi.fn(),
    getProfile: vi.fn().mockResolvedValue({ name: 'Example' }),
  }
})

function photo(slug: string): PhotoSummary {
  return {
    slug,
    title: 'Low sun',
    alt: 'A sunset over still water.',
    draft: false,
    image: {
      kind: 'image',
      width: 2048,
      height: 1365,
      src: '/sun.640.webp',
      sources: [
        {
          type: 'image/webp',
          srcSet: '/sun.640.webp 640w, /sun.2048.webp 2048w',
        },
      ],
    },
  }
}

function album(slug: string): AlbumSummary {
  return {
    slug,
    title: 'A walk',
    description: 'Light along the shore.',
    date: '2026-11-08',
    draft: false,
    count: 2,
    cover: photo('sun'),
  }
}

beforeEach(() => vi.clearAllMocks())

describe('photo static params', () => {
  it('includes both album and photo segments in order', async () => {
    vi.mocked(listAlbums).mockResolvedValue([album('walk'), album('trip')])
    vi.mocked(getAlbum).mockImplementation(slug =>
      Promise.resolve({
        ...album(slug),
        photos: [photo(`${slug}-a`), photo(`${slug}-b`)],
      })
    )
    expect(await albumStaticParams()).toEqual([
      { album: 'walk' },
      { album: 'trip' },
    ])
    expect(await photoStaticParams()).toEqual([
      { album: 'walk', photo: 'walk-a' },
      { album: 'walk', photo: 'walk-b' },
      { album: 'trip', photo: 'trip-a' },
      { album: 'trip', photo: 'trip-b' },
    ])
  })

  it('returns placeholders at both levels for an empty collection', async () => {
    vi.mocked(listAlbums).mockResolvedValue([])
    vi.mocked(getAlbum).mockResolvedValue(null)
    expect(await albumStaticParams()).toEqual([{ album: '__placeholder__' }])
    expect(await photoStaticParams()).toEqual([
      { album: '__placeholder__', photo: '__placeholder__' },
    ])
  })

  it('handles an empty parent defensively', async () => {
    vi.mocked(listAlbums).mockResolvedValue([album('empty')])
    vi.mocked(getAlbum).mockResolvedValue({ ...album('empty'), photos: [] })
    expect(await photoStaticParams()).toEqual([
      { album: 'empty', photo: '__placeholder__' },
    ])
  })
})

describe('album and photo metadata', () => {
  it('returns no metadata for unknown items', async () => {
    vi.mocked(getAlbum).mockResolvedValue(null)
    vi.mocked(getPhoto).mockResolvedValue(null)
    expect(await albumMetadata('missing')).toEqual({})
    expect(await photoMetadata('missing', 'missing')).toEqual({})
  })

  it('uses the album cover and the nested canonical URL', async () => {
    vi.mocked(getAlbum).mockResolvedValue({
      ...album('walk'),
      photos: [photo('sun')],
    })
    expect(await albumMetadata('walk')).toMatchObject({
      title: 'A walk',
      alternates: { canonical: '/photos/walk' },
      openGraph: {
        url: '/photos/walk',
        images: [{ url: '/sun.2048.webp', alt: 'A sunset over still water.' }],
      },
    })
  })

  it('uses the photo preview and only supplies a date when taken is present', async () => {
    const entry = {
      ...photo('sun'),
      album: album('walk'),
      description: 'The light faded.',
      position: 1,
    }
    vi.mocked(getPhoto).mockResolvedValue(entry)
    expect(await photoMetadata('walk', 'sun')).toMatchObject({
      description: 'The light faded.',
      alternates: { canonical: '/photos/walk/sun' },
      openGraph: {
        url: '/photos/walk/sun',
        images: [{ url: '/sun.2048.webp' }],
      },
    })
    expect((await photoMetadata('walk', 'sun')).openGraph).not.toHaveProperty(
      'publishedTime'
    )
    vi.mocked(getPhoto).mockResolvedValue({
      ...entry,
      taken: '2026-11-08 18:42',
    })
    expect((await photoMetadata('walk', 'sun')).openGraph).toHaveProperty(
      'publishedTime',
      '2026-11-08T18:42'
    )
  })
})
