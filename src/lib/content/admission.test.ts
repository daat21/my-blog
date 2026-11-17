import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, expect, it } from 'vitest'

import { admitEntry, classifyPath } from '@/lib/content/admission'
import { collectTextFiles } from '@/lib/content/file-snapshot'
import { createFileSystemSource } from '@/lib/content/file-system-source'
import { createGitHubClient } from '@/lib/content/github-client'
import { exampleSnapshot, fixtureApi } from '@/lib/content/github-fixture'
import { InvalidSnapshot } from '@/lib/content/snapshot-error'

const dirs: string[] = []
afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true }))
  )
})
async function fixture(files: Record<string, string>) {
  const dir = await mkdtemp(path.join(tmpdir(), 'admission-'))
  dirs.push(dir)
  for (const [file, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(dir, file)), { recursive: true })
    await writeFile(path.join(dir, file), text)
  }
  return dir
}
const placeholders = Object.fromEntries(
  ['writing', 'photos', 'projects'].flatMap(root =>
    ['.gitkeep', '.DS_Store'].flatMap(name =>
      [`${root}/${name}`, `${root}/empty/deeper/${name}`].map(file => [
        file,
        '\u0000not text',
      ])
    )
  )
)
it('ignores exact placeholder basenames at any depth, not near-matches or other roots', () => {
  for (const file of Object.keys(placeholders)) {
    expect(classifyPath(file).kind).toBe('ignore')
    expect(admitEntry(file, 'file', 10_000_000)).toBe('ignore')
  }
  for (const file of [
    '.gitkeep',
    'media/.DS_Store',
    'writing/.gitkeep.md',
    'photos/a/.ds_store',
    'writing/a/../.gitkeep',
    'projects/.hidden',
  ])
    expect(classifyPath(file).kind).toBe('deploy')
})
it('filesystem and GitHub omit placeholders and placeholder-only directories', async () => {
  const baseline = await exampleSnapshot()
  const files = { ...baseline.files, ...placeholders }
  const dir = await fixture({
    ...files,
    'README.md': 'housekeeping',
    '.github/workflows/publish.yml': 'housekeeping',
    '.git/config': 'not content',
    'media/anything.bin': 'media',
  })
  expect(await collectTextFiles(dir)).toEqual(baseline.files)
  const api = fixtureApi({ ...baseline, files })
  const calls: string[] = []
  const snapshot = await createGitHubClient({
    repo: 'example/content',
    ref: 'main',
    token: 'fake',
    apiUrl: 'http://127.0.0.1:3221',
    fetcher: url => {
      const key =
        (url instanceof Request ? url.url : String(url)).split(
          '/repos/example/content/'
        )[1] ?? ''
      calls.push(key)
      return Promise.resolve(Response.json(api.get(key)))
    },
  }).loadHead(baseline.mediaTree)
  expect(snapshot.files).toEqual(baseline.files)
  expect(calls.filter(key => key.startsWith('git/blobs/')).length).toBe(
    Object.keys(baseline.files).length
  )
  const source = createFileSystemSource({
    contentDir: dir,
    showDrafts: false,
    media: {
      resolve: () =>
        Promise.resolve({
          kind: 'image',
          width: 640,
          height: 400,
          src: '/_media/fixture.webp',
          sources: [],
        }),
    },
  })
  expect((await source.listPosts()).length).toBe(3)
})
it.each([
  'writing/stray.txt',
  'photos/album/.hidden',
  'projects/nested/stray.md',
])('rejects %s with the same admission reason and path', async file => {
  const dir = await fixture({ [file]: 'stray' })
  const rejection = new InvalidSnapshot('unsupported_path', file)
  await expect(collectTextFiles(dir)).rejects.toEqual(rejection)
  try {
    execFileSync(
      process.execPath,
      [path.resolve('scripts/content/build-baseline.mts')],
      {
        cwd: dir,
        env: {
          NODE_ENV: 'test',
          CONTENT_SOURCE: 'filesystem',
          CONTENT_DIR: dir,
        },
        stdio: 'pipe',
      }
    )
    throw new Error('Baseline unexpectedly accepted a stray file')
  } catch (error) {
    expect(error).toHaveProperty('status', 1)
    expect(error instanceof Error ? error.message : '').toContain(
      rejection.message
    )
  }
  expect(() => admitEntry(file, 'file')).toThrow(rejection.message)
  const source = createFileSystemSource({
    contentDir: dir,
    showDrafts: false,
    media: { resolve: () => Promise.reject(new Error('unused')) },
  })
  await expect(source.listPosts()).rejects.toEqual(rejection)
})
it('does not follow symlinks, including placeholder symlinks', async () => {
  const dir = await fixture({ 'writing/a/index.md': 'text' })
  await symlink('a/index.md', path.join(dir, 'writing/.gitkeep'))
  await expect(collectTextFiles(dir)).rejects.toMatchObject({
    issues: [
      {
        code: 'unsupported_entry',
        path: 'writing/.gitkeep',
      },
    ],
  })
})
