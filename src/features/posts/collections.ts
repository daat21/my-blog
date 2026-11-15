import type { Collection } from '@/lib/content'

interface CollectionInfo {
  title: string
  /** One item, in lower case, e.g. `note`. */
  singular: string
  description: string
}

/** How each collection is named and introduced. */
export const COLLECTIONS: Record<Collection, CollectionInfo> = {
  writing: {
    title: 'Writing',
    singular: 'article',
    description:
      'Longer pieces on building for the web, and what I learn along the way.',
  },
  notes: {
    title: 'Notes',
    singular: 'note',
    description: 'Short notes and snippets: things I want to find again.',
  },
}
