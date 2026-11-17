import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { z } from 'zod'

import { env } from '../../src/lib/env.ts'

const metadata = z.strictObject({
  revision: z.string().regex(/^[a-f0-9]{40}$/),
  mediaTree: z
    .string()
    .regex(/^[a-f0-9]{40}$/)
    .nullable(),
})
const files: Record<string, string> = Object.create(null) as Record<
  string,
  string
>
let total = 0
async function readText(file: string) {
  const target = path.join(env.contentDir, file)
  const info = await lstat(target)
  if (!info.isFile() || info.size > 1024 * 1024)
    throw new Error('Content baseline requires regular text files below 1 MiB')
  const bytes = await readFile(target)
  total += bytes.length
  if (
    bytes.length > 1024 * 1024 ||
    total > 16 * 1024 * 1024 ||
    Object.keys(files).length >= 10_000
  )
    throw new Error('Content baseline exceeds text limits')
  files[file] = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}
async function walk(folder: string): Promise<void> {
  let entries
  try {
    const directory = path.join(env.contentDir, folder)
    if (!(await lstat(directory)).isDirectory())
      throw new Error('Content baseline requires regular directories')
    entries = await readdir(directory, {
      withFileTypes: true,
    })
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return
    throw error
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const file = `${folder}/${entry.name}`
    if (entry.isDirectory()) await walk(file)
    else if (entry.isFile()) await readText(file)
    else throw new Error('Content baseline cannot contain symlinks')
  }
}
const built =
  env.content.source === 'github'
    ? metadata.parse(
        JSON.parse(
          await readFile('.content-runtime/checkout.json', 'utf8')
        ) as unknown
      )
    : { revision: '0'.repeat(40), mediaTree: null }
await readText('profile.yaml')
for (const folder of ['writing', 'photos', 'projects']) await walk(folder)
await mkdir('.content-runtime', { recursive: true })
await writeFile(
  '.content-runtime/baseline.json',
  JSON.stringify({ version: 1, ...built, files })
)
console.log(
  `content:baseline: captured ${Object.keys(files).length} text files`
)
