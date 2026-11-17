import { lstat, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

import { admitEntry, MAX_SNAPSHOT_BYTES, MAX_TEXT_FILES } from './admission.ts'
import { InvalidSnapshot } from './snapshot-error.ts'

/** Collects admitted text only; unrelated repository roots and media are never traversed. */
export async function collectTextFiles(
  contentDir: string
): Promise<Record<string, string>> {
  const files: Record<string, string> = Object.create(null) as Record<
    string,
    string
  >
  let total = 0
  let count = 0
  async function visit(file: string): Promise<void> {
    const target = path.join(contentDir, file)
    let info
    try {
      info = await lstat(target)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
        return
      throw error
    }
    const kind = admitEntry(
      file,
      info.isDirectory() ? 'directory' : info.isFile() ? 'file' : 'unsupported',
      info.size
    )
    if (kind === 'ignore') return
    if (kind === 'directory') {
      for (const entry of await readdir(target)) await visit(`${file}/${entry}`)
      return
    }
    if (++count > MAX_TEXT_FILES) throw new InvalidSnapshot('too_many_files')
    const bytes = await readFile(target)
    // Recheck the actual bytes in case the file grew between stat and read.
    admitEntry(file, 'file', bytes.length)
    total += bytes.length
    if (total > MAX_SNAPSHOT_BYTES)
      throw new InvalidSnapshot('text_budget_exceeded')
    try {
      files[file] = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    } catch {
      throw new InvalidSnapshot('invalid_utf8', file)
    }
  }
  for (const file of ['profile.yaml', 'writing', 'photos', 'projects'])
    await visit(file)
  return files
}
