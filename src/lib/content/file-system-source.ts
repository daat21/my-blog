import type { Dirent } from 'node:fs'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import type { ZodType } from 'zod'

import { ContentError } from '@/lib/content/content-error'
import { parseYamlIn, splitFrontMatter } from '@/lib/content/front-matter'
import {
  firstSentenceOf,
  readingMinutesOf,
  renderMarkdown,
} from '@/lib/content/markdown/render-markdown'
import { resolveImage } from '@/lib/content/resolve-media'
import {
  normalizeTag,
  photoFrontMatterSchema,
  postFrontMatterSchema,
  profileSchema,
  projectFrontMatterSchema,
  validate,
  type PhotoFrontMatter,
  type PostFrontMatter,
} from '@/lib/content/schemas'
import type { ContentSource, PostFilter } from '@/lib/content/source'
import type {
  Photo,
  PhotoSummary,
  Post,
  PostSummary,
  Profile,
  Project,
  TagCount,
} from '@/lib/content/types'
import type { MediaResolver } from '@/lib/media/types'

export interface FileSystemSourceOptions {
  /** Absolute path of the content directory. */
  contentDir: string
  /** Whether posts and photos with `draft: true` are listed and served. */
  showDrafts: boolean
  media: MediaResolver
}

/** A folder of `<slug>/index.md` entries and their front-matter schema. */
interface EntryFolder<Meta> {
  name: string
  /** A slug for the example in error messages. */
  example: string
  schema: ZodType<Meta>
}

const WRITING: EntryFolder<PostFrontMatter> = {
  name: 'writing',
  example: 'my-post',
  schema: postFrontMatterSchema,
}

const PHOTOS: EntryFolder<PhotoFrontMatter> = {
  name: 'photos',
  example: 'my-photo',
  schema: photoFrontMatterSchema,
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PROFILE_FILE = 'profile.yaml'

/** One `<folder>/<slug>/index.md`, with its front matter validated. */
interface Entry<Meta> {
  slug: string
  /** Path relative to the content directory, for error messages. */
  file: string
  meta: Meta
  /** The Markdown body, with line numbers matching the file. */
  body: string
}

/** Checks that a folder or file name is a lowercase kebab-case slug. */
export function isSlug(value: string): boolean {
  return SLUG.test(value)
}

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error.code === 'ENOENT' || error.code === 'ENOTDIR')
  )
}

function compareText(a: string, b: string): number {
  if (a === b) return 0
  return a < b ? -1 : 1
}

interface Dated {
  slug: string
  date: string
}

function newestFirst(a: Dated, b: Dated): number {
  return compareText(b.date, a.date) || compareText(a.slug, b.slug)
}

/** The latest four-digit year in a free-form `year`, such as `2023–2024`. */
function latestYear(year: string | undefined): number {
  const years = year?.match(/\d{4}/g)?.map(Number) ?? []
  return years.length > 0 ? Math.max(...years) : Number.NEGATIVE_INFINITY
}

function byOrderThenNewest(a: Project, b: Project): number {
  if (a.order !== b.order) return a.order - b.order
  const yearA = latestYear(a.year)
  const yearB = latestYear(b.year)
  if (yearA !== yearB) return yearA > yearB ? -1 : 1
  return compareText(a.title, b.title)
}

function slugError(where: string, name: string): ContentError {
  return new ContentError(
    `${where}: "${name}" is not a valid slug; use lowercase letters, digits and single hyphens, e.g. my-first-post`
  )
}

/**
 * Reads content from a directory laid out like the content repository:
 *
 * - `writing/<slug>/index.md`: one post per folder
 * - `photos/<slug>/index.md`: one photograph per folder, with an optional
 *   story as the body
 * - `projects/<slug>.md`: one project per file; only the front matter is
 *   used, the body is ignored
 * - `profile.yaml`
 * - `media/**`, which Markdown references as `media:<path below media/>`
 *   and the media resolver turns into URLs
 *
 * Every file is validated when it is read, and errors name the file.
 */
export function createFileSystemSource(
  options: FileSystemSourceOptions
): ContentSource {
  const { contentDir, showDrafts, media } = options
  let checkedContentDir: Promise<void> | undefined

  function ensureContentDir(): Promise<void> {
    checkedContentDir ??= stat(contentDir).then(
      stats => {
        if (!stats.isDirectory()) {
          throw new ContentError(`Content directory ${contentDir} is a file`)
        }
      },
      (error: unknown) => {
        checkedContentDir = undefined
        throw new ContentError(`Content directory ${contentDir} not found`, {
          cause: error,
        })
      }
    )
    return checkedContentDir
  }

  async function readText(file: string): Promise<string | undefined> {
    try {
      return await readFile(path.join(contentDir, file), 'utf8')
    } catch (error) {
      if (isNotFound(error)) return undefined
      throw error
    }
  }

  /** Lists a folder, skipping dotfiles; a missing folder is empty. */
  async function listFolder(folder: string): Promise<Dirent[]> {
    await ensureContentDir()
    try {
      const entries = await readdir(path.join(contentDir, folder), {
        withFileTypes: true,
      })
      return entries.filter(entry => !entry.name.startsWith('.'))
    } catch (error) {
      if (isNotFound(error)) return []
      throw error
    }
  }

  async function readEntry<Meta>(
    folder: EntryFolder<Meta>,
    slug: string
  ): Promise<Entry<Meta> | undefined> {
    const file = `${folder.name}/${slug}/index.md`
    const source = await readText(file)
    if (source === undefined) return undefined
    const { data, body } = splitFrontMatter(source, file)
    const meta = validate(folder.schema, data, file)
    return { slug, file, meta, body }
  }

  async function readEntries<Meta>(
    folder: EntryFolder<Meta>
  ): Promise<Entry<Meta>[]> {
    const entries = await listFolder(folder.name)
    return Promise.all(
      entries.map(async entry => {
        const where = `${folder.name}/${entry.name}`
        if (!entry.isDirectory()) {
          throw new ContentError(
            `${where}: Expected a folder holding index.md, e.g. ${folder.name}/${folder.example}/index.md`
          )
        }
        if (!isSlug(entry.name)) throw slugError(where, entry.name)
        const read = await readEntry(folder, entry.name)
        if (!read) throw new ContentError(`${where}: Missing index.md`)
        return read
      })
    )
  }

  function isVisible(entry: Entry<{ draft: boolean }>): boolean {
    return showDrafts || !entry.meta.draft
  }

  function summarize(
    post: Entry<PostFrontMatter>,
    readingMinutes = readingMinutesOf(post.body)
  ): PostSummary {
    return { slug: post.slug, ...post.meta, readingMinutes }
  }

  async function listPosts(filter: PostFilter = {}): Promise<PostSummary[]> {
    const tag = filter.tag === undefined ? undefined : normalizeTag(filter.tag)
    return (await readEntries(WRITING))
      .filter(isVisible)
      .filter(post => tag === undefined || post.meta.tags.includes(tag))
      .map(post => summarize(post))
      .sort(newestFirst)
  }

  async function getPost(slug: string): Promise<Post | null> {
    // It may come from a URL, so anything unexpected is simply not found.
    if (!isSlug(slug)) return null
    await ensureContentDir()
    const post = await readEntry(WRITING, slug)
    if (!post || !isVisible(post)) return null
    const rendered = await renderMarkdown(post.body, { file: post.file, media })
    return {
      ...summarize(post, rendered.readingMinutes),
      body: rendered.body,
      headings: rendered.headings,
    }
  }

  async function listTags(): Promise<TagCount[]> {
    const counts = new Map<string, number>()
    for (const post of await listPosts()) {
      for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    return [...counts]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || compareText(a.tag, b.tag))
  }

  async function summarizePhoto({
    slug,
    file,
    meta,
  }: Entry<PhotoFrontMatter>): Promise<PhotoSummary> {
    const { image, ...rest } = meta
    return {
      slug,
      ...rest,
      image: await resolveImage(media, image, `${file}: image`),
    }
  }

  async function listPhotos(): Promise<PhotoSummary[]> {
    const entries = (await readEntries(PHOTOS)).filter(isVisible)
    const photos = await Promise.all(entries.map(summarizePhoto))
    return photos.sort(newestFirst)
  }

  async function getPhoto(slug: string): Promise<Photo | null> {
    // It may come from a URL, so anything unexpected is simply not found.
    if (!isSlug(slug)) return null
    await ensureContentDir()
    const entry = await readEntry(PHOTOS, slug)
    if (!entry || !isVisible(entry)) return null
    const photo = await summarizePhoto(entry)
    if (entry.body.trim() === '') return { ...photo, description: photo.alt }
    const { body: story } = await renderMarkdown(entry.body, {
      file: entry.file,
      media,
    })
    return {
      ...photo,
      story,
      description: firstSentenceOf(entry.body) ?? photo.alt,
    }
  }

  async function readProject(entry: Dirent): Promise<Project> {
    const file = `projects/${entry.name}`
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      throw new ContentError(
        `${file}: Expected a Markdown file, e.g. projects/my-project.md`
      )
    }
    const slug = entry.name.slice(0, -'.md'.length)
    if (!isSlug(slug)) throw slugError(file, slug)
    const source = await readText(file)
    if (source === undefined) throw new ContentError(`${file}: Not found`)
    const { image, ...meta } = validate(
      projectFrontMatterSchema,
      splitFrontMatter(source, file).data,
      file
    )
    return {
      slug,
      ...meta,
      ...(image && {
        image: await resolveImage(media, image, `${file}: image`),
      }),
    }
  }

  async function listProjects(): Promise<Project[]> {
    const entries = await listFolder('projects')
    const projects = await Promise.all(entries.map(readProject))
    return projects.sort(byOrderThenNewest)
  }

  async function getProfile(): Promise<Profile> {
    await ensureContentDir()
    const source = await readText(PROFILE_FILE)
    if (source === undefined) {
      throw new ContentError(
        `${PROFILE_FILE}: Not found in the content directory`
      )
    }
    return validate(
      profileSchema,
      parseYamlIn(source, PROFILE_FILE),
      PROFILE_FILE
    )
  }

  return {
    listPosts,
    getPost,
    listTags,
    listPhotos,
    getPhoto,
    listProjects,
    getProfile,
  }
}
