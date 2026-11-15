import type { MediaResolver } from '@/lib/media/types'

/** What the Markdown plugins need to know about the file they render. */
export interface MarkdownContext {
  /** Path relative to the content directory, used in error messages. */
  file: string
  media: MediaResolver
}
