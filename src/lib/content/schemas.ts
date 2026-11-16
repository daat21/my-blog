import { z } from 'zod'

import { ContentError } from '@/lib/content/content-error'
import { isMediaRef } from '@/lib/content/media-ref'
import type { Profile } from '@/lib/content/types'
import type { MediaRef } from '@/lib/media/types'

/**
 * Turns a tag into lowercase kebab-case: `Next.js` becomes `next-js` and
 * `Design Systems` becomes `design-systems`. Accents are dropped; anything
 * else that is not a letter or digit separates words.
 */
export function normalizeTag(tag: string): string {
  return tag
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const text = z.string().trim().min(1, { error: 'Must not be empty' })

const isoDate = z.iso.date({ error: 'Invalid date, expected YYYY-MM-DD' })

const tag = z.string().transform((value, ctx) => {
  const normalized = normalizeTag(value)
  if (normalized === '') {
    ctx.issues.push({
      code: 'custom',
      message: `Tag "${value}" has no letters or digits`,
      input: value,
    })
    return z.NEVER
  }
  return normalized
})

const mediaRef = z.custom<MediaRef>(
  value => typeof value === 'string' && isMediaRef(value),
  { error: 'Expected a media reference such as media:2026/post/image.png' }
)

const httpUrl = z.url({
  protocol: /^https?$/,
  error: 'Expected an http(s) URL',
})

const externalLink = z.url({ protocol: /^(https?|mailto)$/ })
const SITE_PATH = /^\/(?!\/)\S*$/

/** An http(s) or mailto: URL, or a path on this site such as `/rss.xml`. */
const linkHref = z
  .string()
  .refine(
    value => SITE_PATH.test(value) || externalLink.safeParse(value).success,
    { error: 'Expected an http(s) or mailto: URL, or a path starting with /' }
  )

/** YAML reads `2024` as a number; these fields are free-form strings. */
const yearLike = z
  .union([text, z.number().int().nonnegative()])
  .transform(value => String(value))

const experienceDate = z
  .union([z.string(), z.number()])
  .transform(value => String(value))
  .refine(value => /^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/.test(value), {
    error: issue =>
      `Invalid experience date "${String(issue.input)}", expected YYYY or YYYY-MM (month 01–12)`,
  })

/** Front matter of `writing/<slug>/index.md`. */
export const postFrontMatterSchema = z
  .strictObject({
    title: text,
    description: text,
    date: isoDate,
    updated: isoDate.optional(),
    tags: z.array(tag).transform(tags => [...new Set(tags)]),
    draft: z.boolean().default(false),
  })
  .refine(post => post.updated === undefined || post.updated >= post.date, {
    error: 'Must not be earlier than date',
    path: ['updated'],
  })

export type PostFrontMatter = z.output<typeof postFrontMatterSchema>

/** A content segment must not shadow a framework metadata route. */
export const photoSlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .refine(
    value =>
      ![
        'index',
        'opengraph-image',
        'twitter-image',
        'icon',
        'apple-icon',
        'favicon',
        'robots',
        'sitemap',
        'manifest',
      ].includes(value),
    { error: 'Reserved segment' }
  )

/** Front matter of `photos/<album>/index.md`. */
export const albumFrontMatterSchema = z
  .strictObject({
    title: text,
    description: text,
    date: isoDate,
    endDate: isoDate.optional(),
    location: text.optional(),
    cover: photoSlugSchema.optional(),
    draft: z.boolean().default(false),
  })
  .refine(album => album.endDate === undefined || album.endDate >= album.date, {
    error: 'Must not be earlier than date',
    path: ['endDate'],
  })

export type AlbumFrontMatter = z.output<typeof albumFrontMatterSchema>

/** Front matter of `photos/<album>/<photo>.md`. */
export const photoFrontMatterSchema = z.strictObject({
  title: text,
  taken: z
    .string()
    .refine(
      value => {
        const [date, time, extra] = value.split(' ')
        return (
          isoDate.safeParse(date).success &&
          extra === undefined &&
          (time === undefined || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))
        )
      },
      { error: 'Expected YYYY-MM-DD or YYYY-MM-DD HH:mm' }
    )
    .optional(),
  image: mediaRef,
  alt: z
    .string({
      error: issue =>
        issue.input === undefined
          ? 'Required: describe what the photo shows'
          : undefined,
    })
    .trim()
    .min(1, { error: 'Must not be empty' }),
  location: text.optional(),
  camera: text.optional(),
  lens: text.optional(),
  focalLength: text.optional(),
  aperture: text.optional(),
  shutter: text.optional(),
  iso: z.union([text, z.number()]).transform(String).optional(),
  draft: z.boolean().default(false),
})

export type PhotoFrontMatter = z.output<typeof photoFrontMatterSchema>

/** Front matter of `projects/<slug>.md`. */
export const projectFrontMatterSchema = z.strictObject({
  title: text,
  description: text,
  year: yearLike.optional(),
  status: z.enum(['in progress', 'archived']).optional(),
  stack: z.array(text),
  url: httpUrl.optional(),
  repo: httpUrl.optional(),
  image: mediaRef.optional(),
  featured: z.boolean().default(false),
  order: z.number().int().default(100),
})

export type ProjectFrontMatter = z.output<typeof projectFrontMatterSchema>

/** `profile.yaml`. The annotation keeps the schema in step with `Profile`. */
export const profileSchema: z.ZodType<Profile> = z.strictObject({
  name: text,
  role: text,
  location: text,
  bio: text,
  intro: z.strictObject({
    headline: text,
    detail: text,
    paragraphs: z.array(text),
  }),
  links: z.array(
    z.strictObject({
      label: text,
      href: linkHref,
    })
  ),
  stack: z.array(
    z.strictObject({
      group: text,
      items: z.array(text).min(1, { error: 'List at least one item' }),
    })
  ),
  experience: z.array(
    z.strictObject({
      start: experienceDate,
      end: experienceDate.optional(),
      role: text,
      organization: text,
      note: text.optional(),
      summary: text,
      projects: z
        .array(
          z.strictObject({
            start: experienceDate,
            end: experienceDate.optional(),
            title: text,
            role: text,
            summary: text,
          })
        )
        .optional(),
    })
  ),
})

function formatPath(path: readonly PropertyKey[]): string {
  return path
    .map((key, index) => {
      if (typeof key === 'number') return `[${key}]`
      const name = String(key)
      return index === 0 ? name : `.${name}`
    })
    .join('')
}

function formatIssue(file: string, issue: z.core.$ZodIssue): string[] {
  if (issue.code === 'unrecognized_keys') {
    return issue.keys.map(
      key => `${file}: ${formatPath([...issue.path, key])}: Unknown field`
    )
  }
  const field = formatPath(issue.path)
  return [
    field ? `${file}: ${field}: ${issue.message}` : `${file}: ${issue.message}`,
  ]
}

/**
 * Validates parsed data against a schema. Throws a `ContentError` with one
 * line per problem, each naming the file and the field, for example
 * `writing/foo/index.md: date: Invalid date, expected YYYY-MM-DD`.
 */
export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown,
  file: string
): T {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  const lines = result.error.issues.flatMap(issue => formatIssue(file, issue))
  throw new ContentError(lines.join('\n'))
}
