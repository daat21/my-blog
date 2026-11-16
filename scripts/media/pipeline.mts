import { readFile, readdir, rm, rmdir } from 'node:fs/promises'
import path from 'node:path'

import {
  mediaCacheKey,
  pruneMediaCache,
  restoreMediaCache,
  storeMediaCache,
} from './cache.mts'
import { isNotFound } from './files.mts'
import type { MediaSource, OutputTarget, ProcessedMedia } from './files.mts'
import { processImage, rejectGif } from './image.mts'
import { createManifest, writeManifest } from './manifest.mts'
import type { MediaEntry, MediaManifest } from './manifest.mts'
import { processVideo } from './video.mts'

type Processor = (
  source: MediaSource,
  target: OutputTarget
) => Promise<ProcessedMedia<MediaEntry>>

/** Processors by lower-case file extension. */
const PROCESSORS = new Map<string, Processor>([
  ['.png', processImage],
  ['.jpg', processImage],
  ['.jpeg', processImage],
  ['.webp', processImage],
  ['.mp4', processVideo],
  ['.gif', rejectGif],
])

const SUPPORTED = [...PROCESSORS.keys()].filter(ext => ext !== '.gif')

export interface BuildMediaOptions {
  /** Directory holding the source files: `<content dir>/media`. */
  mediaRoot: string
  output: OutputTarget
  /** Where to write the manifest JSON. */
  manifestPath: string
  /** Omit to process without a persistent cache. */
  cacheDir?: string
  log?: (message: string) => void
}

export interface BuildMediaResult {
  manifest: MediaManifest
  /** Keys of the source files whose outputs were (re)generated. */
  processed: string[]
  /** Keys of the source files whose outputs were all up to date. */
  skipped: string[]
  /** Output files deleted because no source file produces them any more. */
  removed: string[]
}

/** Converts a path below `root` to a key with forward slashes. */
function toKey(root: string, file: string): string {
  return path.relative(root, file).split(path.sep).join('/')
}

/** Lists the files below `root`, sorted, skipping dotfiles and dot folders. */
async function listFiles(root: string): Promise<string[] | undefined> {
  try {
    const entries = await readdir(root, {
      recursive: true,
      withFileTypes: true,
    })
    return entries
      .filter(entry => entry.isFile())
      .map(entry => path.join(entry.parentPath, entry.name))
      .filter(file => !toKey(root, file).split('/').some(isHidden))
      .sort()
  } catch (error) {
    if (isNotFound(error)) return undefined
    throw error
  }
}

function isHidden(segment: string): boolean {
  return segment.startsWith('.')
}

/** Deletes files in `dir` that are not in `keep`, then empty folders. */
async function removeStaleOutputs(
  dir: string,
  keep: ReadonlySet<string>
): Promise<string[]> {
  let entries
  try {
    entries = await readdir(dir, { recursive: true, withFileTypes: true })
  } catch (error) {
    if (isNotFound(error)) return []
    throw error
  }

  const removed: string[] = []
  for (const entry of entries) {
    if (entry.isDirectory()) continue
    const file = path.join(entry.parentPath, entry.name)
    const name = toKey(dir, file)
    if (keep.has(name)) continue
    await rm(file, { force: true })
    removed.push(name)
  }

  // A child's path is longer than its parent's, so children go first.
  const folders = entries
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(entry.parentPath, entry.name))
    .sort((a, b) => b.length - a.length)
  for (const folder of folders) {
    try {
      await rmdir(folder)
    } catch (error) {
      if (!(error instanceof Error && 'code' in error)) throw error
      if (error.code !== 'ENOTEMPTY' && error.code !== 'ENOENT') throw error
    }
  }
  return removed.sort()
}

/**
 * Processes every file below the media root into the output directory and
 * writes the manifest. Fails without writing anything further if any file
 * cannot be processed, listing every failure.
 */
export async function buildMedia({
  mediaRoot,
  output,
  manifestPath,
  cacheDir,
  log,
}: BuildMediaOptions): Promise<BuildMediaResult> {
  const files = await listFiles(mediaRoot)
  if (!files) log?.(`No media folder at ${mediaRoot}; nothing to process.`)

  const entries = new Map<string, MediaEntry>()
  const outputs = new Set<string>()
  const processed: string[] = []
  const skipped: string[] = []
  const failures: string[] = []
  const usedCacheKeys = new Set<string>()

  for (const file of files ?? []) {
    const source = { key: toKey(mediaRoot, file), file }
    const processor = PROCESSORS.get(path.extname(file).toLowerCase())
    try {
      if (!processor) {
        throw new Error(
          `Unsupported file type. Supported types: ${SUPPORTED.join(', ')}.`
        )
      }
      const key = cacheDir
        ? mediaCacheKey(await readFile(file), source.key, output.publicPath)
        : undefined
      const cached =
        cacheDir && key
          ? await restoreMediaCache(cacheDir, key, output)
          : undefined
      const result = cached ?? (await processor(source, output))
      if (cacheDir && key) {
        if (!cached) await storeMediaCache(cacheDir, key, output, result)
        usedCacheKeys.add(key)
      }
      entries.set(source.key, result.entry)
      for (const name of result.outputs) outputs.add(name)
      if (cacheDir ? cached : result.skipped) {
        skipped.push(source.key)
      } else {
        processed.push(source.key)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push(`media/${source.key}: ${message}`)
    }
  }

  if (failures.length > 0) {
    throw new Error(
      `Could not process ${failures.length} of ${files?.length ?? 0} media files:\n` +
        failures.map(failure => `  - ${failure}`).join('\n')
    )
  }

  const manifest = createManifest(entries)
  await writeManifest(manifestPath, manifest)
  const removed = await removeStaleOutputs(output.dir, outputs)
  if (cacheDir) await pruneMediaCache(cacheDir, usedCacheKeys)
  return { manifest, processed, skipped, removed }
}
