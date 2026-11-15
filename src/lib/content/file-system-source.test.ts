import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  createFileSystemSource,
  isSlug,
} from '@/lib/content/file-system-source'
import type { MediaResolver } from '@/lib/media/types'

const media: MediaResolver = {
  resolve(ref) {
    const file = ref.slice('media:'.length)
    if (file.startsWith('missing/')) {
      return Promise.reject(new Error(`No file at media/${file}`))
    }
    return Promise.resolve({
      kind: 'image',
      width: 1200,
      height: 750,
      src: `/_media/${file}.webp`,
      sources: [{ type: 'image/webp', srcSet: `/_media/${file}.webp 1200w` }],
    })
  },
}

const directories: string[] = []

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(dir => rm(dir, { recursive: true, force: true }))
  )
})

async function fixture(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'content-source-'))
  directories.push(dir)
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(dir, name)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, content)
  }
  return dir
}

async function source(files: Record<string, string>, showDrafts = false) {
  return createFileSystemSource({
    contentDir: await fixture(files),
    showDrafts,
    media,
  })
}

interface PostOptions {
  title?: string
  date: string
  tags?: string[]
  draft?: boolean
  body?: string
}

function post({ title = 'A post', date, tags = [], draft, body }: PostOptions) {
  return [
    '---',
    `title: ${title}`,
    'description: A description.',
    `date: ${date}`,
    `tags: [${tags.join(', ')}]`,
    ...(draft === undefined ? [] : [`draft: ${String(draft)}`]),
    '---',
    '',
    body ?? 'Some text.',
    '',
  ].join('\n')
}

interface PhotoOptions {
  title?: string
  date: string
  image?: string
  draft?: boolean
  /** Extra front matter lines, e.g. `location: Exampleton`. */
  fields?: string[]
  body?: string
}

function photo({
  title = 'A photo',
  date,
  image = 'media:photos/a.jpg',
  draft,
  fields = [],
  body = '',
}: PhotoOptions) {
  return [
    '---',
    `title: ${title}`,
    `date: ${date}`,
    `image: ${image}`,
    'alt: Soft light over still water.',
    ...fields,
    ...(draft === undefined ? [] : [`draft: ${String(draft)}`]),
    '---',
    '',
    body,
  ].join('\n')
}

function project(fields: Record<string, string | number | boolean>) {
  const lines = Object.entries(fields).map(
    ([key, value]) =>
      `${key}: ${typeof value === 'string' ? JSON.stringify(value) : String(value)}`
  )
  return [
    '---',
    'description: A project.',
    'stack: [TypeScript]',
    ...lines,
    '---',
    '',
  ].join('\n')
}

const PROFILE = `name: Avery Example
role: Web developer
location: Exampleton
bio: Writes about the web.
intro:
  headline: Hello.
  detail: More.
  paragraphs: [One.]
links: []
stack: []
experience: []
`

describe('isSlug', () => {
  it.each(['a', 'my-post', 'v2', '2026-recap'])('accepts %j', slug => {
    expect(isSlug(slug)).toBe(true)
  })

  it.each([
    '',
    'My-Post',
    'my_post',
    'my--post',
    '-post',
    'post-',
    '../x',
    'a b',
  ])('rejects %j', slug => {
    expect(isSlug(slug)).toBe(false)
  })
})

describe('createFileSystemSource: posts', () => {
  const files = {
    'writing/older/index.md': post({
      date: '2026-01-10',
      tags: ['css', 'Next.js'],
    }),
    'writing/newest/index.md': post({ date: '2026-11-15', tags: ['next-js'] }),
    'writing/secret/index.md': post({
      date: '2026-12-01',
      tags: ['secret', 'css'],
      draft: true,
    }),
    'writing/middle/index.md': post({ date: '2026-06-01', tags: ['css'] }),
    'writing/same-day-b/index.md': post({ date: '2026-03-03' }),
    'writing/same-day-a/index.md': post({ date: '2026-03-03' }),
    'writing/.DS_Store': '',
  }

  it('lists visible posts newest first, by slug on the same day', async () => {
    const posts = await (await source(files)).listPosts()
    expect(posts.map(p => p.slug)).toEqual([
      'newest',
      'middle',
      'same-day-a',
      'same-day-b',
      'older',
    ])
  })

  it('returns summaries with normalised tags and a reading time', async () => {
    const [newest] = await (await source(files)).listPosts()
    expect(newest).toEqual({
      slug: 'newest',
      title: 'A post',
      description: 'A description.',
      date: '2026-11-15',
      tags: ['next-js'],
      draft: false,
      readingMinutes: 1,
    })
  })

  it('filters by tag', async () => {
    const content = await source(files)
    expect(
      (await content.listPosts({ tag: 'Next.js' })).map(p => p.slug)
    ).toEqual(['newest', 'older'])
    expect((await content.listPosts({ tag: 'css' })).map(p => p.slug)).toEqual([
      'middle',
      'older',
    ])
  })

  it('includes drafts only when showDrafts is on', async () => {
    const hidden = await source(files)
    expect((await hidden.listPosts()).map(p => p.slug)).not.toContain('secret')
    expect(await hidden.getPost('secret')).toBeNull()

    const shown = await source(files, true)
    expect((await shown.listPosts())[0]).toMatchObject({
      slug: 'secret',
      draft: true,
    })
    expect(await shown.getPost('secret')).toMatchObject({
      slug: 'secret',
    })
  })

  it('aggregates tags from visible posts, most used first', async () => {
    expect(await (await source(files)).listTags()).toEqual([
      { tag: 'css', count: 2 },
      { tag: 'next-js', count: 2 },
    ])
    expect(await (await source(files, true)).listTags()).toEqual([
      { tag: 'css', count: 3 },
      { tag: 'next-js', count: 2 },
      { tag: 'secret', count: 1 },
    ])
  })

  it('returns an empty list without a writing folder', async () => {
    const content = await source({ 'profile.yaml': PROFILE })
    expect(await content.listPosts()).toEqual([])
    expect(await content.listTags()).toEqual([])
  })
})

describe('createFileSystemSource: getPost', () => {
  it('renders the body with headings and reading time', async () => {
    const content = await source({
      'writing/hello/index.md': post({
        date: '2026-02-02',
        body: '## First part\n\nText.\n\n### Detail\n\nMore text.',
      }),
    })
    const hello = await content.getPost('hello')
    expect(hello).toMatchObject({
      slug: 'hello',
      readingMinutes: 1,
      headings: [
        { depth: 2, id: 'first-part', text: 'First part' },
        { depth: 3, id: 'detail', text: 'Detail' },
      ],
    })
    expect(hello?.body.type).toBe('root')
  })

  it('returns null for unknown or malformed slugs', async () => {
    const content = await source({
      'writing/real/index.md': post({ date: '2026-02-02' }),
      'secret.md': post({ date: '2026-02-02' }),
    })
    expect(await content.getPost('missing')).toBeNull()
    expect(await content.getPost('../secret')).toBeNull()
    expect(await content.getPost('Real')).toBeNull()
  })

  it('reports Markdown errors with the line in the file', async () => {
    const file = post({
      date: '2026-02-02',
      body: 'Intro.\n\n![](media:a.png)',
    })
    const line = file.split('\n').indexOf('![](media:a.png)') + 1
    expect(line).toBeGreaterThan(3)
    const content = await source({ 'writing/broken/index.md': file })
    await expect(content.getPost('broken')).rejects.toThrow(
      `writing/broken/index.md:${line}:1: Image media:a.png has no alt text`
    )
  })
})

describe('createFileSystemSource: validation', () => {
  it('names the file and the field for invalid front matter', async () => {
    const content = await source({
      'writing/bad-date/index.md': post({ date: '2026-13-01' }),
    })
    await expect(content.listPosts()).rejects.toThrow(
      'writing/bad-date/index.md: date: Invalid date, expected YYYY-MM-DD'
    )
  })

  it('fails on invalid drafts too, so they are fixed before publishing', async () => {
    const content = await source({
      'writing/draft/index.md': post({ date: 'soon', draft: true }),
    })
    await expect(content.listPosts()).rejects.toThrow(
      'writing/draft/index.md: date:'
    )
  })

  it.each(['My-Post', 'my_post', 'my--post'])(
    'rejects the post folder %j',
    async name => {
      const content = await source({
        [`writing/${name}/index.md`]: post({ date: '2026-01-01' }),
      })
      await expect(content.listPosts()).rejects.toThrow(
        `writing/${name}: "${name}" is not a valid slug`
      )
    }
  )

  it('rejects stray files in the writing folder', async () => {
    const content = await source({
      'writing/stray.md': post({ date: '2026-01-01' }),
    })
    await expect(content.listPosts()).rejects.toThrow(
      'writing/stray.md: Expected a folder holding index.md'
    )
  })

  it('rejects a post folder without index.md', async () => {
    const content = await source({ 'writing/empty/README.md': 'Hi' })
    await expect(content.listPosts()).rejects.toThrow(
      'writing/empty: Missing index.md'
    )
  })

  it('fails when the content directory does not exist', async () => {
    const content = createFileSystemSource({
      contentDir: path.join(tmpdir(), 'content-source-does-not-exist'),
      showDrafts: false,
      media,
    })
    await expect(content.listPosts()).rejects.toThrow(
      /^Content directory .* not found$/
    )
    await expect(content.getProfile()).rejects.toThrow(/not found$/)
  })
})

describe('createFileSystemSource: photos', () => {
  const files = {
    'photos/older/index.md': photo({ date: '2026-01-10' }),
    'photos/newest/index.md': photo({
      title: 'Newest',
      date: '2026-11-15',
      image: 'media:photos/newest.jpg',
      fields: [
        'location: Exampleton',
        'camera: Example R1',
        'lens: 35 mm ƒ/2',
        "exposure: 'ƒ/2.8 · 1/250 s · ISO 200'",
      ],
    }),
    'photos/same-day-b/index.md': photo({ date: '2026-06-01' }),
    'photos/same-day-a/index.md': photo({ date: '2026-06-01' }),
    'photos/secret/index.md': photo({ date: '2026-12-01', draft: true }),
    'photos/.DS_Store': '',
  }

  it('lists visible photos newest first, by slug on the same day', async () => {
    const photos = await (await source(files)).listPhotos()
    expect(photos.map(p => p.slug)).toEqual([
      'newest',
      'same-day-a',
      'same-day-b',
      'older',
    ])
  })

  it('returns summaries with the image resolved', async () => {
    const [newest] = await (await source(files)).listPhotos()
    expect(newest).toEqual({
      slug: 'newest',
      title: 'Newest',
      date: '2026-11-15',
      image: {
        kind: 'image',
        width: 1200,
        height: 750,
        src: '/_media/photos/newest.jpg.webp',
        sources: [
          {
            type: 'image/webp',
            srcSet: '/_media/photos/newest.jpg.webp 1200w',
          },
        ],
      },
      alt: 'Soft light over still water.',
      location: 'Exampleton',
      camera: 'Example R1',
      lens: '35 mm ƒ/2',
      exposure: 'ƒ/2.8 · 1/250 s · ISO 200',
      draft: false,
    })
  })

  it('includes drafts only when showDrafts is on', async () => {
    const hidden = await source(files)
    expect((await hidden.listPhotos()).map(p => p.slug)).not.toContain('secret')
    expect(await hidden.getPhoto('secret')).toBeNull()

    const shown = await source(files, true)
    expect((await shown.listPhotos())[0]).toMatchObject({
      slug: 'secret',
      draft: true,
    })
    expect(await shown.getPhoto('secret')).toMatchObject({ slug: 'secret' })
  })

  it('describes a photo without a story by its alt text', async () => {
    const older = await (await source(files)).getPhoto('older')
    expect(older).toMatchObject({
      slug: 'older',
      description: 'Soft light over still water.',
    })
    expect(older).not.toHaveProperty('story')
  })

  it('renders the story and describes the photo by its first sentence', async () => {
    const content = await source({
      'photos/told/index.md': photo({
        date: '2026-02-02',
        body: 'We waited an hour for the fog. It never lifted.\n',
      }),
    })
    const told = await content.getPhoto('told')
    expect(told).toMatchObject({
      slug: 'told',
      description: 'We waited an hour for the fog.',
    })
    expect(told?.story?.type).toBe('root')
    expect(told?.story?.children.length).toBeGreaterThan(0)
  })

  it('returns null for unknown or malformed slugs', async () => {
    const content = await source(files)
    expect(await content.getPhoto('missing')).toBeNull()
    expect(await content.getPhoto('../older')).toBeNull()
    expect(await content.getPhoto('Older')).toBeNull()
  })

  it('returns an empty list without a photos folder', async () => {
    expect(
      await (await source({ 'profile.yaml': PROFILE })).listPhotos()
    ).toEqual([])
  })

  it('names the file and the field for invalid front matter', async () => {
    const content = await source({
      'photos/bad/index.md': photo({ date: '2026-02-30' }),
    })
    await expect(content.listPhotos()).rejects.toThrow(
      'photos/bad/index.md: date: Invalid date, expected YYYY-MM-DD'
    )
  })

  it('names the file and field when the image cannot be resolved', async () => {
    const content = await source({
      'photos/lost/index.md': photo({
        date: '2026-02-02',
        image: 'media:missing/lost.jpg',
      }),
    })
    await expect(content.listPhotos()).rejects.toThrow(
      'photos/lost/index.md: image: Cannot resolve media:missing/lost.jpg'
    )
  })

  it('rejects non-kebab-case folders and stray files', async () => {
    await expect(
      (
        await source({
          'photos/Low_Sun/index.md': photo({ date: '2026-01-01' }),
        })
      ).listPhotos()
    ).rejects.toThrow('photos/Low_Sun: "Low_Sun" is not a valid slug')
    await expect(
      (await source({ 'photos/stray.jpg': 'x' })).listPhotos()
    ).rejects.toThrow(
      'photos/stray.jpg: Expected a folder holding index.md, e.g. photos/my-photo/index.md'
    )
  })
})

describe('createFileSystemSource: projects', () => {
  it('sorts by order, then newest year, then title', async () => {
    const content = await source({
      'projects/old.md': project({ title: 'Old', year: 2019 }),
      'projects/range.md': project({ title: 'Range', year: '2021–2025' }),
      'projects/new.md': project({ title: 'New', year: 2024 }),
      'projects/undated.md': project({ title: 'Undated' }),
      'projects/pinned.md': project({ title: 'Pinned', year: 2010, order: 1 }),
      'projects/also-old.md': project({ title: 'Also old', year: 2019 }),
    })
    expect((await content.listProjects()).map(p => p.slug)).toEqual([
      'pinned',
      'range',
      'new',
      'also-old',
      'old',
      'undated',
    ])
  })

  it('resolves the image and applies defaults', async () => {
    const content = await source({
      'projects/demo.md': project({
        title: 'Demo',
        image: 'media:projects/demo.png',
        featured: true,
        status: 'in progress',
      }),
    })
    expect(await content.listProjects()).toEqual([
      {
        slug: 'demo',
        title: 'Demo',
        description: 'A project.',
        stack: ['TypeScript'],
        status: 'in progress',
        featured: true,
        order: 100,
        image: {
          kind: 'image',
          width: 1200,
          height: 750,
          src: '/_media/projects/demo.png.webp',
          sources: [
            {
              type: 'image/webp',
              srcSet: '/_media/projects/demo.png.webp 1200w',
            },
          ],
        },
      },
    ])
  })

  it('names the file and field when the image cannot be resolved', async () => {
    const content = await source({
      'projects/demo.md': project({
        title: 'Demo',
        image: 'media:missing/demo.png',
      }),
    })
    await expect(content.listProjects()).rejects.toThrow(
      'projects/demo.md: image: Cannot resolve media:missing/demo.png: No file at media/missing/demo.png'
    )
  })

  it('rejects non-kebab-case file names and non-Markdown files', async () => {
    await expect(
      (
        await source({ 'projects/My Project.md': project({ title: 'X' }) })
      ).listProjects()
    ).rejects.toThrow(
      'projects/My Project.md: "My Project" is not a valid slug'
    )
    await expect(
      (await source({ 'projects/readme.txt': 'x' })).listProjects()
    ).rejects.toThrow('projects/readme.txt: Expected a Markdown file')
  })

  it('returns an empty list without a projects folder', async () => {
    expect(
      await (await source({ 'profile.yaml': PROFILE })).listProjects()
    ).toEqual([])
  })
})

describe('createFileSystemSource: profile', () => {
  it('reads and validates profile.yaml', async () => {
    const profile = await (
      await source({ 'profile.yaml': PROFILE })
    ).getProfile()
    expect(profile).toMatchObject({ name: 'Avery Example', links: [] })
  })

  it('names the field when profile.yaml is invalid', async () => {
    const content = await source({
      'profile.yaml': PROFILE.replace('location: Exampleton\n', ''),
    })
    await expect(content.getProfile()).rejects.toThrow(
      'profile.yaml: location:'
    )
  })

  it('fails when profile.yaml is missing', async () => {
    const content = await source({
      'writing/a/index.md': post({ date: '2026-01-01' }),
    })
    await expect(content.getProfile()).rejects.toThrow(
      'profile.yaml: Not found in the content directory'
    )
  })
})
