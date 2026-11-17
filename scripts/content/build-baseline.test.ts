import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, expect, it } from 'vitest'

const directories: string[] = []
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(dir => rm(dir, { recursive: true, force: true }))
  )
})
async function build(files: Record<string, string>) {
  const dir = await mkdtemp(path.join(tmpdir(), 'baseline-'))
  directories.push(dir)
  const profile = await readFile('content-example/profile.yaml', 'utf8')
  for (const [file, text] of Object.entries({
    'profile.yaml': profile,
    '.media/manifest.json': JSON.stringify({ version: 1, items: {} }),
    ...files,
  })) {
    await mkdir(path.dirname(path.join(dir, file)), { recursive: true })
    await writeFile(path.join(dir, file), text)
  }
  const result = spawnSync(
    process.execPath,
    [path.resolve('scripts/content/build-baseline.mts')],
    {
      cwd: dir,
      env: { NODE_ENV: 'test', CONTENT_SOURCE: 'filesystem', CONTENT_DIR: dir },
      encoding: 'utf8',
    }
  )
  return { dir, ...result }
}
it('validates a repository-shaped tree while ignoring unrelated roots and placeholders', async () => {
  const result = await build({
    'README.md': 'example',
    '.github/workflows/publish.yml': 'example',
    'media/file.bin': '\u0000',
    '.git/config': 'not visited',
    'writing/.gitkeep': '\u0000',
    'photos/empty/deep/.DS_Store': '\u0000',
    'projects/.DS_Store': '\u0000',
  })
  expect(result.status, result.stderr).toBe(0)
  const output: unknown = JSON.parse(
    await readFile(
      path.join(result.dir, '.content-runtime/baseline.json'),
      'utf8'
    )
  )
  expect(output).toMatchObject({
    files: {
      'profile.yaml': await readFile('content-example/profile.yaml', 'utf8'),
    },
  })
  expect(JSON.stringify(output)).not.toContain('.gitkeep')
})
it.each(['![example](media:missing/image.jpg)', ':::unknown\nExample\n:::'])(
  'fully validates hidden draft bodies at baseline time: %s',
  async body => {
    const result = await build({
      'writing/hidden/index.md': `---\ntitle: Hidden\ndescription: Example\ndate: 2026-01-01\ntags: []\ndraft: true\n---\n${body}`,
    })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(
      'writing/hidden/index.md failed content validation'
    )
    expect(result.stderr).toContain('validation_failed')
  }
)
