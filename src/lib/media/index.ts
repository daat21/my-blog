import path from 'node:path'

import { createLocalMediaResolver } from '@/lib/media/local-media-resolver'
import type { MediaResolver } from '@/lib/media/types'

export type * from '@/lib/media/types'

let resolver: MediaResolver | undefined

/** Returns the media resolver for the current environment. */
export function getMediaResolver(): MediaResolver {
  resolver ??= createLocalMediaResolver({
    // Written by `pnpm media:build`, which runs before `next build`.
    manifestPath: path.join(process.cwd(), '.media', 'manifest.json'),
  })
  return resolver
}
