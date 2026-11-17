import { cacheLife, cacheTag } from 'next/cache'
import { beforeEach, expect, it, vi } from 'vitest'

import { getAlbum, getPhoto, getPost } from '@/lib/content'
import { readPosts, readAlbums } from '@/lib/content/collection-cache'
import { selectContent } from '@/lib/content/runtime-source'
import type { ContentSource } from '@/lib/content/source'

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock('@/lib/content/collection-cache', () => ({
  readPosts: vi.fn(),
  readAlbums: vi.fn(),
}))
vi.mock('@/lib/content/runtime-source', () => ({ selectContent: vi.fn() }))
const source: ContentSource = {
  getPost: () => Promise.resolve(null),
  getAlbum: () => Promise.resolve(null),
  getPhoto: () => Promise.resolve(null),
  listPosts: () => Promise.resolve([]),
  listTags: () => Promise.resolve([]),
  listAlbums: () => Promise.resolve([]),
  listProjects: () => Promise.resolve([]),
  getProfile: () => Promise.reject(new Error('unused')),
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(selectContent).mockResolvedValue({ source, degraded: false })
  vi.mocked(readPosts).mockResolvedValue({
    posts: [],
    tags: [],
    degraded: false,
  })
  vi.mocked(readAlbums).mockResolvedValue({
    albums: [],
    photos: {},
    degraded: false,
  })
})
it('tags negative item reads, including album membership for unknown photos', async () => {
  expect(await getPost('new-post')).toBeNull()
  expect(await getAlbum('new-album')).toBeNull()
  expect(await getPhoto('new-album', 'new-photo')).toBeNull()
  expect(vi.mocked(cacheTag).mock.calls).toEqual([
    ['post:new-post'],
    ['album:new-album'],
    ['album:new-album', 'photo:new-album/new-photo'],
  ])
  expect(cacheLife).toHaveBeenCalledWith('max')
  expect(selectContent).not.toHaveBeenCalled()
})
it('never gives fallback content a max lifetime', async () => {
  vi.mocked(readPosts).mockResolvedValue({
    posts: [],
    tags: [],
    degraded: true,
  })
  await getPost('example')
  expect(cacheLife).toHaveBeenCalledExactlyOnceWith({
    stale: 30,
    revalidate: 30,
    expire: 300,
  })
})
it('selects current content for a newly published member instead of a stale module snapshot', async () => {
  vi.mocked(readPosts).mockResolvedValue({
    posts: [
      {
        slug: 'new-post',
        title: 'New',
        description: 'Example',
        date: '2026-01-01',
        tags: [],
        draft: false,
        readingMinutes: 1,
      },
    ],
    tags: [],
    degraded: false,
  })
  await getPost('new-post')
  expect(selectContent).toHaveBeenCalledOnce()
})
it('shares membership for every distinct missing photo of a real album', async () => {
  vi.mocked(readAlbums).mockResolvedValue({
    albums: [],
    photos: { example: ['known'] },
    degraded: false,
  })
  await Promise.all(
    Array.from({ length: 30 }, (_, i) => getPhoto('example', `missing-${i}`))
  )
  expect(selectContent).not.toHaveBeenCalled()
})
