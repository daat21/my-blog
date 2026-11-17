import { stat } from 'node:fs/promises'

import { ContentError } from '@/lib/content/content-error'
import { collectTextFiles } from '@/lib/content/file-snapshot'
import { createReaderSource } from '@/lib/content/reader-source'
import { snapshotReader } from '@/lib/content/snapshot'
import type { ContentSource } from '@/lib/content/source'
import type { MediaResolver } from '@/lib/media/types'

export { isSlug } from '@/lib/content/reader-source'

export interface FileSystemSourceOptions {
  contentDir: string
  showDrafts: boolean
  media: MediaResolver
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
  let pending: ReturnType<typeof loadReader> | undefined
  async function loadReader() {
    await ensureRoot()
    return snapshotReader({
      version: 1,
      revision: '0'.repeat(40),
      mediaTree: null,
      files: await collectTextFiles(contentDir),
    })
  }
  function reader() {
    pending ??= loadReader().finally(() => {
      pending = undefined
    })
    return pending
  }
  return createReaderSource({
    showDrafts,
    media,
    reader: {
      ensureRoot,
      readText: async file => (await reader()).readText(file),
      listFolder: async folder => (await reader()).listFolder(folder),
    },
  })
}
