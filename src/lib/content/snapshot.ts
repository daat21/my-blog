import { z } from 'zod'

import { splitFrontMatter } from '@/lib/content/front-matter'
import { renderMarkdown } from '@/lib/content/markdown/render-markdown'
import { classifyPath } from '@/lib/content/publish-paths'
import {
  createReaderSource,
  type ContentReader,
} from '@/lib/content/reader-source'
import type { MediaResolver } from '@/lib/media/types'

export const MAX_TEXT_BYTES = 1024 * 1024
export const MAX_SNAPSHOT_BYTES = 16 * MAX_TEXT_BYTES
export const MAX_TEXT_FILES = 10_000
export const shaSchema = z.string().regex(/^[a-f0-9]{40}$/)
export const snapshotSchema = z.strictObject({
  version: z.literal(1),
  revision: shaSchema,
  mediaTree: shaSchema.nullable(),
  files: z.record(z.string(), z.string()),
})
export type TextSnapshot = z.infer<typeof snapshotSchema>

/** Exposes an immutable text snapshot through the same reader as local files. */
export function snapshotReader(snapshot: TextSnapshot): ContentReader {
  const files = new Map(Object.entries(snapshot.files))
  return {
    ensureRoot: () => Promise.resolve(),
    readText: file => Promise.resolve(files.get(file)),
    listFolder(folder) {
      const entries = new Map<string, boolean>()
      for (const file of files.keys()) {
        if (!file.startsWith(`${folder}/`)) continue
        const tail = file.slice(folder.length + 1)
        const name = tail.split('/')[0]
        if (name) entries.set(name, tail.includes('/'))
      }
      return Promise.resolve(
        [...entries].map(([name, directory]) => ({
          name,
          isDirectory: () => directory,
          isFile: () => !directory,
        }))
      )
    },
  }
}

/** Validates every file and rendered body, including hidden drafts, before admission. */
export async function validateSnapshot(
  input: unknown,
  media: MediaResolver
): Promise<TextSnapshot> {
  const snapshot = snapshotSchema.parse(input)
  const entries = Object.entries(snapshot.files)
  if (entries.length > MAX_TEXT_FILES)
    throw new Error('snapshot: too many files')
  let total = 0
  for (const [file, text] of entries) {
    if (classifyPath(file).kind !== 'text')
      throw new Error(`snapshot: unsupported path ${file}`)
    const size = Buffer.byteLength(text)
    if (size > MAX_TEXT_BYTES)
      throw new Error(`snapshot: text too large ${file}`)
    total += size
  }
  if (total > MAX_SNAPSHOT_BYTES)
    throw new Error('snapshot: text budget exceeded')
  const source = createReaderSource({
    reader: snapshotReader(snapshot),
    showDrafts: true,
    media,
  })
  await source.getProfile()
  await source.listProjects()
  // Empty albums and hidden stories must be checked too, not just visible lists.
  for (const [file, text] of entries) {
    if (file.startsWith('writing/') || file.startsWith('photos/')) {
      await renderMarkdown(splitFrontMatter(text, file).body, { file, media })
    }
  }
  for (const post of await source.listPosts()) await source.getPost(post.slug)
  for (const album of await source.listAlbums()) {
    const entry = await source.getAlbum(album.slug)
    for (const photo of entry?.photos ?? [])
      await source.getPhoto(album.slug, photo.slug)
  }
  return snapshot
}
