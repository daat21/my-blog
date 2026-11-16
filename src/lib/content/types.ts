import type { Root } from 'hast'

import type { ResolvedImage } from '@/lib/media/types'

export interface Heading {
  depth: 2 | 3
  /** Matches the `id` that rehype-slug gives the heading element. */
  id: string
  text: string
}

export interface PostSummary {
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

export interface PhotoSummary {
  slug: string
  title: string
  taken?: string
  image: ResolvedImage
  /** What the photograph shows, for people who cannot see it. */
  alt: string
  location?: string
  camera?: string
  lens?: string
  focalLength?: string
  aperture?: string
  shutter?: string
  iso?: string
  draft: boolean
}

export interface Photo extends PhotoSummary {
  /** The optional story told below the photograph, as a HAST tree. */
  story?: Root
  /** The story's first sentence, or the alt text when there is no story. */
  description: string
  album: AlbumSummary
  previous?: PhotoSummary
  next?: PhotoSummary
  position: number
}

export interface AlbumSummary {
  slug: string
  title: string
  description: string
  date: string
  endDate?: string
  location?: string
  draft: boolean
  cover: PhotoSummary
  count: number
}

export interface Album extends AlbumSummary {
  photos: PhotoSummary[]
  intro?: Root
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

export interface ExperienceProject {
  /** `YYYY` or `YYYY-MM`. */
  start: string
  /** Omitted while ongoing. */
  end?: string
  title: string
  role: string
  summary: string
}

export interface ExperienceEntry {
  /** `YYYY` or `YYYY-MM`. */
  start: string
  /** Omitted while ongoing. */
  end?: string
  role: string
  organization: string
  note?: string
  summary: string
  /** Rendered in the order written, newest first. */
  projects?: ExperienceProject[]
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
