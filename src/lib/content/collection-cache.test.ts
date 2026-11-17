import { cacheLife, cacheTag } from 'next/cache'
import { beforeEach, expect, it, vi } from 'vitest'

import { readPosts, readAlbums } from '@/lib/content/collection-cache'
import { createFileSystemSource } from '@/lib/content/file-system-source'
import { selectContent } from '@/lib/content/runtime-source'

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock('@/lib/content/runtime-source', () => ({ selectContent: vi.fn() }))
const source = createFileSystemSource({
  contentDir: `${process.cwd()}/content-example`,
  showDrafts: false,
  media: {
    resolve: () =>
      Promise.resolve({
        kind: 'image',
        width: 100,
        height: 100,
        src: '/_media/example.webp',
        sources: [],
      }),
  },
})
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(selectContent).mockResolvedValue({ source, degraded: false })
})
it('uses max while healthy and tags shared post and photo membership for publication', async () => {
  const posts = await readPosts()
  const albums = await readAlbums()
  expect(posts.posts.map(post => post.slug)).toHaveLength(3)
  expect(posts.tags).toEqual(await source.listTags())
  expect(albums.albums.map(album => album.slug)).toEqual([
    'coastal-light',
    'ordinary-days',
  ])
  expect(albums.photos['coastal-light']).toEqual(['tide-pool', 'low-sun'])
  expect(cacheLife).toHaveBeenCalledTimes(2)
  expect(vi.mocked(cacheLife).mock.calls).toEqual([['max'], ['max']])
  expect(vi.mocked(cacheTag).mock.calls).toEqual([['posts'], ['albums']])
})
it('carries degraded selection health to callers without ever assigning max', async () => {
  vi.mocked(selectContent).mockResolvedValue({ source, degraded: true })
  expect((await readPosts()).degraded).toBe(true)
  expect((await readAlbums()).degraded).toBe(true)
  expect(cacheLife).not.toHaveBeenCalledWith('max')
  expect(cacheLife).toHaveBeenCalledWith({
    stale: 30,
    revalidate: 30,
    expire: 300,
  })
})
