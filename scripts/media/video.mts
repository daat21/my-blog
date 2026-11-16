import { readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  contentHash,
  fileExists,
  outputName,
  publicUrl,
  writeFileAtomic,
} from './files.mts'
import type { MediaSource, OutputTarget, ProcessedMedia } from './files.mts'
import type { VideoEntry } from './manifest.mts'
import { readMp4Dimensions } from './mp4-dimensions.mts'

/**
 * Copies an MP4 video under a content-hashed name and reads its display
 * size. The copy is skipped when it already exists.
 */
export async function processVideo(
  source: MediaSource,
  target: OutputTarget
): Promise<ProcessedMedia<VideoEntry>> {
  const input = await readFile(source.file)
  const hash = contentHash(input)
  const { width, height } = readMp4Dimensions(input)

  const name = outputName(source.key, hash, 'mp4')
  const skipped = await fileExists(path.join(target.dir, name))
  if (!skipped) await writeFileAtomic(path.join(target.dir, name), input)

  return {
    entry: {
      kind: 'video',
      hash,
      width,
      height,
      type: 'video/mp4',
      src: publicUrl(target, name),
    },
    outputs: [name],
    skipped,
  }
}
