import type { MediaResolver } from './types'

export type * from './types'

/** Returns the media resolver for the current environment. */
export function getMediaResolver(): MediaResolver {
  throw new Error('The media resolver is not implemented yet.')
}
