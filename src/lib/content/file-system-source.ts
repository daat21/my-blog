import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import { ContentError } from '@/lib/content/content-error'
import { createReaderSource } from '@/lib/content/reader-source'
import type { ContentSource } from '@/lib/content/source'
import type { MediaResolver } from '@/lib/media/types'

export { isSlug } from '@/lib/content/reader-source'

export interface FileSystemSourceOptions {
  contentDir: string
  showDrafts: boolean
  media: MediaResolver
}

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error.code === 'ENOENT' || error.code === 'ENOTDIR')
  )
}

/** Reads validated content from the local content directory. */
export function createFileSystemSource({
  contentDir,
  showDrafts,
  media,
}: FileSystemSourceOptions): ContentSource {
  let checked: Promise<void> | undefined
  function ensureRoot(): Promise<void> {
    checked ??= stat(contentDir).then(
      stats => {
        if (!stats.isDirectory())
          throw new ContentError(`Content directory ${contentDir} is a file`)
      },
      (error: unknown) => {
        checked = undefined
        throw new ContentError(`Content directory ${contentDir} not found`, {
          cause: error,
        })
      }
    )
    return checked
  }
  return createReaderSource({
    showDrafts,
    media,
    reader: {
      ensureRoot,
      async readText(file) {
        try {
          return await readFile(path.join(contentDir, file), 'utf8')
        } catch (error) {
          if (isNotFound(error)) return undefined
          throw error
        }
      },
      async listFolder(folder) {
        await ensureRoot()
        try {
          return (
            await readdir(path.join(contentDir, folder), {
              withFileTypes: true,
            })
          ).filter(entry => !entry.name.startsWith('.'))
        } catch (error) {
          if (isNotFound(error)) return []
          throw error
        }
      },
    },
  })
}
