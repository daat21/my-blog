import { beforeAll, describe, expect, it, vi } from 'vitest'

import { createFileSystemSource } from '@/lib/content/file-system-source'
import {
  createGitHubClient,
  GitHubUnavailable,
  MediaChanged,
  InvalidSnapshot,
} from '@/lib/content/github-client'
import { exampleSnapshot, fixtureApi } from '@/lib/content/github-fixture'
import {
  createGitHubSource,
  SnapshotRejected,
} from '@/lib/content/github-source'
import { validateSnapshot, type TextSnapshot } from '@/lib/content/snapshot'
import type { MediaResolver } from '@/lib/media/types'

let baseline: TextSnapshot
beforeAll(async () => {
  baseline = await exampleSnapshot()
})
const media: MediaResolver = {
  async resolve(ref) {
    await Promise.resolve()
    if (ref.includes('missing'))
      throw new Error(`Unknown media reference "${ref}"`)
    if (ref.endsWith('.mp4'))
      return {
        kind: 'video',
        width: 100,
        height: 100,
        sources: [{ type: 'video/mp4', src: '/_media/test.mp4' }],
      }
    return {
      kind: 'image',
      width: 100,
      height: 100,
      src: '/_media/test.webp',
      sources: [],
    }
  },
}
function fixture() {
  let current = baseline
  let fail = false
  let transform: (key: string, value: unknown) => unknown = (_, value) => value
  const calls: { key: string; init?: RequestInit }[] = []
  const fetcher: typeof fetch = (input, init) => {
    const key =
      (input instanceof Request ? input.url : String(input)).split(
        '/repos/example/content/'
      )[1] ?? ''
    calls.push({ key, init })
    const value = fixtureApi(current).get(key)
    return Promise.resolve(
      fail
        ? new Response('private upstream secret', { status: 403 })
        : value === undefined
          ? new Response('', { status: 404 })
          : Response.json(transform(key, value))
    )
  }
  const options = {
    repo: 'example/content',
    ref: 'main',
    token: 'fake-token',
    apiUrl: 'http://127.0.0.1:3221',
    fetcher,
    baseline: () => Promise.resolve(baseline),
    media,
    showDrafts: false,
    isBuild: false,
  }
  return {
    options,
    calls,
    set: (value: TextSnapshot) => {
      current = value
    },
    fail: () => {
      fail = true
    },
    transform: (fn: typeof transform) => {
      transform = fn
    },
  }
}

describe('GitHub content snapshots', () => {
  it('matches filesystem parsing, visibility and ordering for the full example', async () => {
    const f = fixture()
    const source = createGitHubSource(f.options)
    const selected = await source.select()
    expect(selected.degraded).toBe(false)
    const fs = createFileSystemSource({
      contentDir: `${process.cwd()}/content-example`,
      showDrafts: false,
      media,
    })
    expect(await selected.source.getProfile()).toEqual(await fs.getProfile())
    expect(await selected.source.listProjects()).toEqual(
      await fs.listProjects()
    )
    expect(await selected.source.listTags()).toEqual(await fs.listTags())
    for (const post of await fs.listPosts())
      expect(await selected.source.getPost(post.slug)).toEqual(
        await fs.getPost(post.slug)
      )
    for (const album of await fs.listAlbums()) {
      expect(await selected.source.getAlbum(album.slug)).toEqual(
        await fs.getAlbum(album.slug)
      )
      for (const photo of (await fs.getAlbum(album.slug))?.photos ?? [])
        expect(await selected.source.getPhoto(album.slug, photo.slug)).toEqual(
          await fs.getPhoto(album.slug, photo.slug)
        )
    }
    expect(
      f.calls.some(call =>
        call.key.includes(baseline.mediaTree ?? 'impossible')
      )
    ).toBe(false)
    expect(f.calls[0]?.init?.cache).toBe('no-store')
    expect(
      f.calls.slice(1).every(call => call.init?.cache === 'force-cache')
    ).toBe(true)
    expect(await selected.source.getPost('../escape')).toBeNull()
    expect(await selected.source.getAlbum('unknown')).toBeNull()
    expect(await selected.source.getPhoto('unknown', 'unknown')).toBeNull()
  })
  it('rejects unsafe text before admission, keeps warm previous and cold baseline', async () => {
    const f = fixture()
    const changed = {
      ...baseline,
      revision: 'c'.repeat(40),
      files: {
        ...baseline.files,
        'profile.yaml':
          baseline.files['profile.yaml']?.replace(
            'Avery Example',
            'Updated Example'
          ) ?? '',
      },
    }
    f.set(changed)
    const source = createGitHubSource(f.options)
    expect((await (await source.select()).source.getProfile()).name).toBe(
      'Updated Example'
    )
    f.set({
      ...changed,
      revision: 'd'.repeat(40),
      files: {
        ...changed.files,
        'writing/broken/index.md':
          '---\ntitle: Broken\ndescription: Example\ndate: 2026-01-01\ntags: []\n---\n![example](media:missing/image.jpg)',
      },
    })
    await expect(source.preflight()).rejects.toBeInstanceOf(SnapshotRejected)
    const warm = await source.select()
    expect(warm.degraded).toBe(true)
    expect((await warm.source.getProfile()).name).toBe('Updated Example')
    expect(await warm.source.getPost('broken')).toBeNull()
    const cold = await createGitHubSource(f.options).select()
    expect(cold.degraded).toBe(true)
    expect((await cold.source.getProfile()).name).toBe('Avery Example')
    f.set({ ...changed, revision: 'e'.repeat(40) })
    expect((await source.select()).degraded).toBe(false)
  })
  it('gates media before fetching text and never depends on history', async () => {
    const f = fixture()
    f.set({ ...baseline, revision: 'd'.repeat(40), mediaTree: 'f'.repeat(40) })
    await expect(
      createGitHubSource(f.options).preflight()
    ).rejects.toBeInstanceOf(MediaChanged)
    expect(f.calls).toHaveLength(2)
    expect(f.calls.some(call => call.key.includes('parents'))).toBe(false)
  })
  it('uses the baseline on API errors and prerenders without network', async () => {
    const f = fixture()
    f.fail()
    const source = createGitHubSource(f.options)
    await expect(source.preflight()).rejects.toBeInstanceOf(GitHubUnavailable)
    expect((await source.select()).degraded).toBe(true)
    const built = await createGitHubSource({
      ...f.options,
      isBuild: true,
    }).select()
    expect(built.degraded).toBe(false)
    expect(await built.source.getProfile()).toEqual(
      await (await source.select()).source.getProfile()
    )
  })
  it('recovers truncated recursive trees without treating content as absent', async () => {
    const f = fixture()
    f.transform((key, value) =>
      key.endsWith('?recursive=1')
        ? { ...(value as object), truncated: true, tree: [] }
        : value
    )
    const result = await createGitHubClient(f.options).loadHead(
      baseline.mediaTree
    )
    expect(result.files).toEqual(baseline.files)
    expect(
      f.calls.some(
        call => call.key.startsWith('git/trees/') && !call.key.includes('?')
      )
    ).toBe(true)
  })
  it.each(['symlink', 'traversal', 'size', 'utf8', 'envelope'])(
    'rejects %s from the API',
    async kind => {
      const f = fixture()
      f.transform((key, value) => {
        if (kind === 'envelope' && key.startsWith('commits')) return {}
        if (key.endsWith('?recursive=1')) {
          const tree = value as { tree: object[] }
          if (kind === 'symlink')
            return {
              ...tree,
              tree: [
                ...tree.tree,
                {
                  path: 'link.md',
                  type: 'blob',
                  mode: '120000',
                  sha: 'a'.repeat(40),
                },
              ],
            }
          if (kind === 'traversal')
            return {
              ...tree,
              tree: [
                ...tree.tree,
                {
                  path: '../escape.md',
                  type: 'blob',
                  mode: '100644',
                  sha: 'a'.repeat(40),
                },
              ],
            }
        }
        if (key.startsWith('git/blobs/')) {
          if (kind === 'size')
            return { encoding: 'base64', size: 1024 * 1024 + 1, content: '' }
          if (kind === 'utf8')
            return { encoding: 'base64', size: 1, content: '/w==' }
        }
        return value
      })
      await expect(
        createGitHubClient(f.options).loadHead(baseline.mediaTree)
      ).rejects.toBeInstanceOf(InvalidSnapshot)
    }
  )
  it('fully validates hidden stories and empty-album intros', async () => {
    for (const file of ['photos/empty/index.md', 'photos/empty/hidden.md']) {
      const files: Record<string, string> = {
        ...baseline.files,
        'photos/empty/index.md':
          '---\ntitle: Empty\ndescription: An empty album\ndate: 2026-01-01\n---\n',
      }
      files[file] =
        `${files[file] ?? '---\ntitle: Hidden\nimage: media:photos/example.jpg\nalt: Example\ndraft: true\n---\n'}\n![bad](media:missing/no.jpg)`
      await expect(
        validateSnapshot({ ...baseline, files }, media)
      ).rejects.toThrow()
    }
  })
  it('rejects missing profile, duplicate paths and snapshot budgets', async () => {
    const files = { ...baseline.files }
    delete files['profile.yaml']
    await expect(
      validateSnapshot({ ...baseline, files }, media)
    ).rejects.toThrow('profile.yaml')
    await expect(
      validateSnapshot(
        { ...baseline, files: { 'profile.yaml': 'x'.repeat(1024 * 1024 + 1) } },
        media
      )
    ).rejects.toThrow('text too large')
    await expect(
      validateSnapshot(
        {
          ...baseline,
          files: Object.fromEntries(
            Array.from({ length: 10001 }, (_, i) => [
              `writing/post-${i}/index.md`,
              '',
            ])
          ),
        },
        media
      )
    ).rejects.toThrow('too many files')
    await expect(
      validateSnapshot(
        {
          ...baseline,
          files: Object.fromEntries(
            Array.from({ length: 17 }, (_, i) => [
              `writing/post-${i}/index.md`,
              'x'.repeat(1024 * 1024),
            ])
          ),
        },
        media
      )
    ).rejects.toThrow('text budget')
    const f = fixture()
    f.transform((key, value) => {
      if (!key.endsWith('?recursive=1')) return value
      const result = value as { tree: object[] }
      return { ...result, tree: [...result.tree, ...result.tree] }
    })
    await expect(
      createGitHubClient(f.options).loadHead(baseline.mediaTree)
    ).rejects.toBeInstanceOf(InvalidSnapshot)
  })
  it('backs off on rate limiting and never exposes upstream response text', async () => {
    const f = fixture()
    f.fail()
    const client = createGitHubClient(f.options)
    await expect(client.loadHead(baseline.mediaTree)).rejects.toThrow(
      'github_unavailable'
    )
    const calls = f.calls.length
    await expect(client.loadHead(baseline.mediaTree)).rejects.toThrow(
      'github_unavailable'
    )
    expect(f.calls).toHaveLength(calls)
  })
  it('limits concurrency to four and maps aborts to unavailable', async () => {
    const f = fixture()
    let active = 0
    let peak = 0
    const original = f.options.fetcher
    const fetcher: typeof fetch = async (input, init) => {
      active++
      peak = Math.max(peak, active)
      await new Promise(resolve => setTimeout(resolve, 2))
      try {
        return await original(input, init)
      } finally {
        active--
      }
    }
    await createGitHubClient({ ...f.options, fetcher }).loadHead(
      baseline.mediaTree
    )
    expect(peak).toBeLessThanOrEqual(4)
    const aborted = vi.fn<typeof fetch>(() =>
      Promise.reject(new DOMException('aborted', 'AbortError'))
    )
    await expect(
      createGitHubClient({ ...f.options, fetcher: aborted }).loadHead(
        baseline.mediaTree
      )
    ).rejects.toBeInstanceOf(GitHubUnavailable)
  })
})
