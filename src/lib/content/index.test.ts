import { cacheLife, cacheTag } from 'next/cache'
import { beforeEach, expect, it, vi } from 'vitest'

import { getAlbum, getPhoto, getPost } from '@/lib/content'
import { selectContent } from '@/lib/content/runtime-source'
import type { ContentSource } from '@/lib/content/source'

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
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
})
it('never gives fallback content a max lifetime', async () => {
  vi.mocked(selectContent).mockResolvedValue({ source, degraded: true })
  await getPost('example')
  expect(cacheLife).toHaveBeenCalledExactlyOnceWith({
    stale: 30,
    revalidate: 30,
    expire: 300,
  })
})
