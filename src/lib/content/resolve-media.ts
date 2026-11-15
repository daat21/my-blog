import { ContentError, messageOf } from '@/lib/content/content-error'
import type {
  MediaRef,
  MediaResolver,
  ResolvedImage,
  ResolvedMedia,
  ResolvedVideo,
} from '@/lib/media/types'

async function resolveAt(
  media: MediaResolver,
  ref: MediaRef,
  where: string
): Promise<ResolvedMedia> {
  try {
    return await media.resolve(ref)
  } catch (error) {
    throw new ContentError(
      `${where}: Cannot resolve ${ref}: ${messageOf(error)}`,
      { cause: error }
    )
  }
}

/** Resolves a reference that must be an image; `where` prefixes errors. */
export async function resolveImage(
  media: MediaResolver,
  ref: MediaRef,
  where: string
): Promise<ResolvedImage> {
  const resolved = await resolveAt(media, ref, where)
  if (resolved.kind !== 'image') {
    throw new ContentError(`${where}: ${ref} is a video, expected an image`)
  }
  return resolved
}

/** Resolves a reference that must be a video; `where` prefixes errors. */
export async function resolveVideo(
  media: MediaResolver,
  ref: MediaRef,
  where: string
): Promise<ResolvedVideo> {
  const resolved = await resolveAt(media, ref, where)
  if (resolved.kind !== 'video') {
    throw new ContentError(`${where}: ${ref} is an image, expected a video`)
  }
  return resolved
}
