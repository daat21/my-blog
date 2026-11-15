import { createHash } from 'node:crypto'
import { access, mkdir, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

/** A file below the media root. */
export interface MediaSource {
  /** Path below the media root with forward slashes: `2026/post/home.png`. */
  key: string
  /** Absolute path on disk. */
  file: string
}

/** Where generated files go, and the URL path that serves them. */
export interface OutputTarget {
  /** Absolute directory, e.g. `<repo>/public/_media`. */
  dir: string
  /** URL path of `dir` without a trailing slash, e.g. `/_media`. */
  publicPath: string
}

/** What processing one source file produced. */
export interface ProcessedMedia<Entry> {
  entry: Entry
  /** Output files relative to the output directory, with forward slashes. */
  outputs: string[]
  /** True when every output already existed and nothing was written. */
  skipped: boolean
}

const HASH_LENGTH = 12

/** Returns the first 12 hex digits of the SHA-256 of `parts`. */
export function contentHash(...parts: (string | Uint8Array)[]): string {
  const hash = createHash('sha256')
  for (const part of parts) hash.update(part)
  return hash.digest('hex').slice(0, HASH_LENGTH)
}

/**
 * Names an output file after its source: `2026/post/home.png` with hash
 * `3f2a9c1b7e4d` and suffix `640.avif` becomes
 * `2026/post/home.3f2a9c1b7e4d.640.avif`.
 */
export function outputName(key: string, hash: string, suffix: string): string {
  const { dir, name } = path.posix.parse(key)
  return path.posix.join(dir, `${name}.${hash}.${suffix}`)
}

/** Returns the URL of an output file, percent-encoding each segment. */
export function publicUrl(target: OutputTarget, name: string): string {
  const encoded = name.split('/').map(encodeURIComponent).join('/')
  return `${target.publicPath}/${encoded}`
}

export function isNotFound(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

export async function fileExists(file: string): Promise<boolean> {
  try {
    await access(file)
    return true
  } catch (error) {
    if (isNotFound(error)) return false
    throw error
  }
}

/**
 * Writes through a temporary file and a rename, so that an interrupted run
 * never leaves a partial file that a later run would take as complete.
 */
export async function writeFileAtomic(
  file: string,
  data: string | Uint8Array
): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.${process.pid}.tmp`
  await writeFile(temporary, data)
  await rename(temporary, file)
}
