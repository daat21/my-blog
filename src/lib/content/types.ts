import type { Root } from 'hast'

import type { ResolvedImage } from '@/lib/media/types'

export type Collection = 'writing' | 'notes'

export interface Heading {
  depth: 2 | 3
  /** Matches the `id` that rehype-slug gives the heading element. */
  id: string
  text: string
}

export interface PostSummary {
  collection: Collection
  slug: string
  title: string
  description: string
  /** ISO date, `YYYY-MM-DD`. */
  date: string
  updated?: string
  tags: string[]
  draft: boolean
  readingMinutes: number
}

export interface Post extends PostSummary {
  /**
   * The rendered body as a HAST tree. It is turned into React elements in
   * the posts feature, which maps elements to UI components; lib/ must not
   * depend on components.
   */
  body: Root
  headings: Heading[]
}

export interface TagCount {
  tag: string
  count: number
}

export interface Project {
  slug: string
  title: string
  description: string
  year?: string
  status?: 'in progress' | 'archived'
  stack: string[]
  url?: string
  repo?: string
  image?: ResolvedImage
  featured: boolean
  /** Lower numbers sort first. */
  order: number
}

export interface ProfileLink {
  label: string
  href: string
}

export interface StackGroup {
  group: string
  items: string[]
}

export interface ExperienceEntry {
  /** Free-form, e.g. `2024` or `2024-03`. */
  start: string
  /** Omitted while ongoing. */
  end?: string
  role: string
  organization: string
  summary: string
}

export interface Profile {
  name: string
  role: string
  location: string
  /** One or two sentences for the sidebar. */
  bio: string
  intro: {
    /** First sentence of the home intro, in full contrast. */
    headline: string
    /** Second sentence, rendered muted. */
    detail: string
    paragraphs: string[]
  }
  links: ProfileLink[]
  stack: StackGroup[]
  experience: ExperienceEntry[]
}
