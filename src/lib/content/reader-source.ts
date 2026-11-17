import type { ZodType } from 'zod'

import { ContentError } from '@/lib/content/content-error'
import { parseYamlIn, splitFrontMatter } from '@/lib/content/front-matter'
import {
  firstSentenceOf,
  summarizeMarkdown,
  renderMarkdown,
  type MarkdownSummary,
} from '@/lib/content/markdown/render-markdown'
import { resolveImage } from '@/lib/content/resolve-media'
import {
  normalizeTag,
  albumFrontMatterSchema,
  photoFrontMatterSchema,
  photoSlugSchema,
  postFrontMatterSchema,
  profileSchema,
  projectFrontMatterSchema,
  validate,
  type AlbumFrontMatter,
  type PhotoFrontMatter,
  type PostFrontMatter,
} from '@/lib/content/schemas'
import type { ContentSource, PostFilter } from '@/lib/content/source'
import type {
  Album,
  AlbumSummary,
  Photo,
  PhotoSummary,
  Post,
  PostSummary,
  Profile,
  Project,
  TagCount,
} from '@/lib/content/types'
import type { MediaResolver } from '@/lib/media/types'

export interface ContentReader {
  ensureRoot(): Promise<void>
  readText(file: string): Promise<string | undefined>
  listFolder(folder: string): Promise<ContentEntry[]>
}

export interface ContentEntry {
  name: string
  isDirectory(): boolean
  isFile(): boolean
}

export interface ReaderSourceOptions {
  reader: ContentReader
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

const ALBUMS: EntryFolder<AlbumFrontMatter> = {
  name: 'photos',
  example: 'my-album',
  schema: albumFrontMatterSchema,
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
 * - `photos/<album>/index.md`: one album, with an optional intro
 * - `photos/<album>/<photo>.md`: one photograph with an optional story
 * - `projects/<slug>.md`: one project per file; only the front matter is
 *   used, the body is ignored
 * - `profile.yaml`
 * - `media/**`, which Markdown references as `media:<path below media/>`
 *   and the media resolver turns into URLs
 *
 * Every file is validated when it is read, and errors name the file.
 */
export function createReaderSource(
  options: ReaderSourceOptions
): ContentSource {
  const { reader, showDrafts, media } = options
  const ensureContentDir = () => reader.ensureRoot()
  const readText = (file: string) => reader.readText(file)
  const listFolder = (folder: string) => reader.listFolder(folder)

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

  async function summarize(
    post: Entry<PostFrontMatter>,
    summary: MarkdownSummary = summarizeMarkdown(post.body, post.file)
  ): Promise<PostSummary> {
    const { readingMinutes, cover } = summary
    return {
      slug: post.slug,
      ...post.meta,
      readingMinutes,
      ...(cover && {
        cover: {
          image: await resolveImage(media, cover.src, `${post.file}: cover`),
          alt: cover.alt,
        },
      }),
    }
  }

  async function listPosts(filter: PostFilter = {}): Promise<PostSummary[]> {
    const tag = filter.tag === undefined ? undefined : normalizeTag(filter.tag)
    const posts = (await readEntries(WRITING))
      .filter(isVisible)
      .filter(post => tag === undefined || post.meta.tags.includes(tag))
    return (await Promise.all(posts.map(post => summarize(post)))).sort(
      newestFirst
    )
  }

  async function getPost(slug: string): Promise<Post | null> {
    // It may come from a URL, so anything unexpected is simply not found.
    if (!isSlug(slug)) return null
    await ensureContentDir()
    const post = await readEntry(WRITING, slug)
    if (!post || !isVisible(post)) return null
    const rendered = await renderMarkdown(post.body, { file: post.file, media })
    return {
      ...(await summarize(post, rendered)),
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

  async function readAlbumEntries() {
    const albums = await readEntries(ALBUMS)
    return Promise.all(
      albums.map(async album => {
        if (!photoSlugSchema.safeParse(album.slug).success) {
          throw slugError(`photos/${album.slug}`, album.slug)
        }
        const files = await listFolder(`photos/${album.slug}`)
        const entries = await Promise.all(
          files
            .filter(file => file.name !== 'index.md')
            .map(async file => {
              const where = `photos/${album.slug}/${file.name}`
              if (!file.isFile() || !file.name.endsWith('.md')) {
                throw new ContentError(
                  `${where}: Expected a Markdown photo file`
                )
              }
              const slug = file.name.slice(0, -3)
              if (!photoSlugSchema.safeParse(slug).success)
                throw slugError(where, slug)
              const source = await readText(where)
              if (source === undefined)
                throw new ContentError(`${where}: Not found`)
              const { data, body } = splitFrontMatter(source, where)
              const meta = validate(photoFrontMatterSchema, data, where)
              return { slug, file: where, meta, body }
            })
        )
        if (
          album.meta.cover &&
          !entries.some(photo => photo.slug === album.meta.cover)
        ) {
          throw new ContentError(
            `${album.file}: cover: No photo named ${album.meta.cover} in this album`
          )
        }
        entries.sort((a, b) => {
          if (a.meta.taken === undefined && b.meta.taken !== undefined) return 1
          if (b.meta.taken === undefined && a.meta.taken !== undefined)
            return -1
          return (
            compareText(a.meta.taken ?? '', b.meta.taken ?? '') ||
            compareText(a.slug, b.slug)
          )
        })
        return { album, entries }
      })
    )
  }

  async function visibleAlbums() {
    const albums = await readAlbumEntries()
    const visible = await Promise.all(
      albums
        .filter(({ album }) => isVisible(album))
        .map(async ({ album, entries }) => {
          const photos = await Promise.all(
            entries.filter(isVisible).map(async entry => ({
              ...(await summarizePhoto(entry)),
              location: entry.meta.location ?? album.meta.location,
            }))
          )
          const cover =
            photos.find(photo => photo.slug === album.meta.cover) ?? photos[0]
          if (!cover) return null
          const summary: AlbumSummary = {
            ...album.meta,
            slug: album.slug,
            cover,
            count: photos.length,
          }
          return { album, entries, photos, summary }
        })
    )
    return visible
      .filter(item => item !== null)
      .sort((a, b) => newestFirst(a.summary, b.summary))
  }

  async function listAlbums(): Promise<AlbumSummary[]> {
    return (await visibleAlbums()).map(item => item.summary)
  }

  async function getAlbum(slug: string): Promise<Album | null> {
    if (!photoSlugSchema.safeParse(slug).success) return null
    const item = (await visibleAlbums()).find(item => item.album.slug === slug)
    if (!item) return null
    const intro = item.album.body.trim()
      ? (
          await renderMarkdown(item.album.body, {
            file: item.album.file,
            media,
          })
        ).body
      : undefined
    return { ...item.summary, photos: item.photos, intro }
  }

  async function getPhoto(album: string, slug: string): Promise<Photo | null> {
    if (
      !photoSlugSchema.safeParse(album).success ||
      !photoSlugSchema.safeParse(slug).success
    )
      return null
    const item = (await visibleAlbums()).find(item => item.album.slug === album)
    if (!item) return null
    const index = item.photos.findIndex(photo => photo.slug === slug)
    const photo = item.photos[index]
    const entry = item.entries.find(entry => entry.slug === slug)
    if (!photo || !entry) return null
    const story = entry.body.trim()
      ? (await renderMarkdown(entry.body, { file: entry.file, media })).body
      : undefined
    return {
      ...photo,
      story,
      description: firstSentenceOf(entry.body) ?? photo.alt,
      album: item.summary,
      previous: item.photos[index - 1],
      next: item.photos[index + 1],
      position: index + 1,
    }
  }

  async function readProject(entry: ContentEntry): Promise<Project> {
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
    listAlbums,
    getAlbum,
    getPhoto,
    listProjects,
    getProfile,
  }
}
