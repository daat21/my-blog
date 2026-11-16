import { createHash } from 'node:crypto'
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
} from 'node:fs/promises'
import path from 'node:path'

import { z } from 'zod'

import { fileExists, isNotFound, writeFileAtomic } from './files.mts'
import type { OutputTarget, ProcessedMedia } from './files.mts'
import { mediaEntrySchema } from './manifest.mts'
import type { MediaEntry } from './manifest.mts'
import { MEDIA_RECIPE } from './recipe.mts'

/** Next.js build cache is restored by Vercel between deployments. */
export const MEDIA_CACHE_DIR = '.next/cache/media'

function sha256(data: string | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}

/** Paths and URL prefix matter because entries contain source-specific URLs. */
export function mediaCacheKey(
  input: Uint8Array,
  sourceKey: string,
  publicPath: string,
  recipe: unknown = MEDIA_RECIPE
): string {
  return sha256(
    JSON.stringify({
      source: sha256(input),
      recipe: sha256(JSON.stringify(recipe)),
      sourceKey,
      publicPath,
    })
  )
}

// Cache metadata is external input: reject absolute paths and traversal.
const relativeOutput = z
  .string()
  .refine(
    name =>
      name.length > 0 &&
      !name.includes('\\') &&
      name
        .split('/')
        .every(segment => segment !== '' && segment !== '.' && segment !== '..')
  )
const recordSchema = z.object({
  entry: mediaEntrySchema,
  outputs: z.array(relativeOutput).min(1),
})

async function copyAtomic(from: string, to: string): Promise<void> {
  await mkdir(path.dirname(to), { recursive: true })
  const temporary = `${to}.${process.pid}.tmp`
  await copyFile(from, temporary)
  await rename(temporary, to)
}

/** A missing, incomplete or invalid entry is a miss, not a build failure. */
export async function restoreMediaCache(
  dir: string,
  key: string,
  output: OutputTarget
): Promise<ProcessedMedia<MediaEntry> | undefined> {
  const entryDir = path.join(dir, key)
  let data: unknown
  try {
    data = JSON.parse(await readFile(path.join(entryDir, 'entry.json'), 'utf8'))
  } catch (error) {
    if (isNotFound(error) || error instanceof SyntaxError) return undefined
    throw error
  }
  const parsed = recordSchema.safeParse(data)
  if (!parsed.success) return undefined
  const { entry, outputs } = parsed.data
  const files = outputs.map(name => path.join(entryDir, 'files', name))
  if (!(await Promise.all(files.map(fileExists))).every(Boolean))
    return undefined
  for (const name of outputs) {
    await copyAtomic(
      path.join(entryDir, 'files', name),
      path.join(output.dir, name)
    )
  }
  return { entry, outputs, skipped: true }
}

/** Publish metadata last so an interrupted write cannot become a cache hit. */
export async function storeMediaCache(
  dir: string,
  key: string,
  output: OutputTarget,
  result: ProcessedMedia<MediaEntry>
): Promise<void> {
  const entryDir = path.join(dir, key)
  await rm(entryDir, { recursive: true, force: true })
  for (const name of result.outputs) {
    await copyAtomic(
      path.join(output.dir, name),
      path.join(entryDir, 'files', name)
    )
  }
  await writeFileAtomic(
    path.join(entryDir, 'entry.json'),
    JSON.stringify({
      entry: result.entry,
      outputs: result.outputs,
    })
  )
}

/** Keep only entries used by the successfully completed build. */
export async function pruneMediaCache(
  dir: string,
  used: ReadonlySet<string>
): Promise<void> {
  let names: string[]
  try {
    names = await readdir(dir)
  } catch (error) {
    if (isNotFound(error)) return
    throw error
  }
  for (const name of names) {
    if (!used.has(name))
      await rm(path.join(dir, name), { recursive: true, force: true })
  }
}
