import { z } from 'zod'

import { splitFrontMatter } from '@/lib/content/front-matter'
import { renderMarkdown } from '@/lib/content/markdown/render-markdown'
import {
  admitEntry,
  MAX_TEXT_BYTES,
  MAX_SNAPSHOT_BYTES,
  MAX_TEXT_FILES,
} from '@/lib/content/admission'
import { InvalidSnapshot } from '@/lib/content/snapshot-error'
import {
  createReaderSource,
  type ContentReader,
} from '@/lib/content/reader-source'
import type { MediaResolver } from '@/lib/media/types'

export {
  MAX_TEXT_BYTES,
  MAX_SNAPSHOT_BYTES,
  MAX_TEXT_FILES,
} from '@/lib/content/admission'
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
  const parsed = snapshotSchema.safeParse(input)
  if (!parsed.success) throw new InvalidSnapshot()
  const snapshot = {
    ...parsed.data,
    files: Object.fromEntries(
      Object.entries(parsed.data.files).filter(
        ([file, text]) =>
          admitEntry(file, 'file', Buffer.byteLength(text)) === 'text'
      )
    ),
  }
  const entries = Object.entries(snapshot.files)
  if (entries.length > MAX_TEXT_FILES)
    throw new InvalidSnapshot('too_many_files')
  let total = 0
  for (const [file, text] of entries) {
    const size = Buffer.byteLength(text)
    if (size > MAX_TEXT_BYTES) throw new InvalidSnapshot('text_too_large', file)
    total += size
    if (total > MAX_SNAPSHOT_BYTES)
      throw new InvalidSnapshot('text_budget_exceeded')
  }
  if (!('profile.yaml' in snapshot.files))
    throw new InvalidSnapshot('missing_profile', 'profile.yaml')
  try {
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
  } catch (error) {
    if (error instanceof InvalidSnapshot) throw error
    const message = error instanceof Error ? error.message : ''
    const file =
      entries.find(([file]) => message.includes(file))?.[0] ??
      /^((?:writing|photos|projects)\/[a-zA-Z0-9 /._-]+):/.exec(message)?.[1]
    const ref = /media:[a-zA-Z0-9/._-]+/.exec(message)?.[0]
    throw new InvalidSnapshot('validation_failed', file, ref)
  }
}
