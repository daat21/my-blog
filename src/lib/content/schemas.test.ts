import { describe, expect, it } from 'vitest'

import { ContentError } from '@/lib/content/content-error'
import {
  normalizeTag,
  albumFrontMatterSchema,
  photoFrontMatterSchema,
  postFrontMatterSchema,
  profileSchema,
  projectFrontMatterSchema,
  validate,
} from '@/lib/content/schemas'

const FILE = 'writing/foo/index.md'

const validPost = {
  title: 'A post',
  description: 'About something.',
  date: '2026-11-15',
  tags: ['nextjs'],
}

function errorOf(run: () => unknown): ContentError {
  try {
    run()
  } catch (error) {
    if (error instanceof ContentError) return error
    throw error
  }
  throw new Error('Expected a ContentError')
}

describe('normalizeTag', () => {
  it.each([
    ['nextjs', 'nextjs'],
    ['Next.js', 'next-js'],
    ['Design Systems', 'design-systems'],
    ['  CSS  ', 'css'],
    ['under_score', 'under-score'],
    ['Café', 'cafe'],
    ['--already-kebab--', 'already-kebab'],
  ])('turns %j into %j', (input, expected) => {
    expect(normalizeTag(input)).toBe(expected)
  })
})

describe('postFrontMatterSchema', () => {
  it('applies defaults and normalises tags', () => {
    const post = validate(
      postFrontMatterSchema,
      { ...validPost, tags: ['Next.js', 'next-js', 'Design'] },
      FILE
    )
    expect(post).toEqual({
      title: 'A post',
      description: 'About something.',
      date: '2026-11-15',
      tags: ['next-js', 'design'],
      draft: false,
    })
  })

  it('names the file and the field for an invalid date', () => {
    const error = errorOf(() =>
      validate(
        postFrontMatterSchema,
        { ...validPost, date: '15/11/2026' },
        FILE
      )
    )
    expect(error.message).toBe(
      'writing/foo/index.md: date: Invalid date, expected YYYY-MM-DD'
    )
  })

  it('rejects dates that do not exist', () => {
    const error = errorOf(() =>
      validate(
        postFrontMatterSchema,
        { ...validPost, date: '2026-02-30' },
        FILE
      )
    )
    expect(error.message).toContain('writing/foo/index.md: date: Invalid date')
  })

  it('reports every problem on its own line', () => {
    const error = errorOf(() =>
      validate(
        postFrontMatterSchema,
        { description: '', date: '2026-11-15', tags: ['ok', 3] },
        FILE
      )
    )
    const lines = error.message.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toMatch(/^writing\/foo\/index\.md: title: /)
    expect(lines[1]).toBe(
      'writing/foo/index.md: description: Must not be empty'
    )
    expect(lines[2]).toMatch(/^writing\/foo\/index\.md: tags\[1\]: /)
  })

  it('rejects unknown fields, so a typo cannot publish a draft', () => {
    const error = errorOf(() =>
      validate(postFrontMatterSchema, { ...validPost, drafts: true }, FILE)
    )
    expect(error.message).toBe('writing/foo/index.md: drafts: Unknown field')
  })

  it('rejects a tag without letters or digits', () => {
    const error = errorOf(() =>
      validate(
        postFrontMatterSchema,
        { ...validPost, tags: ['ok', '!!'] },
        FILE
      )
    )
    expect(error.message).toBe(
      'writing/foo/index.md: tags[1]: Tag "!!" has no letters or digits'
    )
  })

  it('rejects an update earlier than the publication date', () => {
    const error = errorOf(() =>
      validate(
        postFrontMatterSchema,
        { ...validPost, updated: '2026-01-01' },
        FILE
      )
    )
    expect(error.message).toBe(
      'writing/foo/index.md: updated: Must not be earlier than date'
    )
  })

  it('requires draft to be a boolean', () => {
    const error = errorOf(() =>
      validate(postFrontMatterSchema, { ...validPost, draft: 'yes' }, FILE)
    )
    expect(error.message).toMatch(/^writing\/foo\/index\.md: draft: /)
  })
})

describe('albumFrontMatterSchema', () => {
  const album = {
    title: 'A walk',
    description: 'Light along the shore.',
    date: '2026-11-08',
  }
  it('applies defaults and accepts optional fields', () => {
    expect(albumFrontMatterSchema.parse(album)).toEqual({
      ...album,
      draft: false,
    })
    const full = {
      ...album,
      endDate: '2026-11-09',
      location: 'Sample Bay',
      cover: 'low-sun',
      draft: true,
    }
    expect(albumFrontMatterSchema.parse(full)).toEqual(full)
  })
  it.each([
    { title: '' },
    { description: '' },
    { date: '2026-02-30' },
    { endDate: '2026-01-01' },
    { cover: '../escape' },
    { cover: 'index' },
    { cover: 'opengraph-image' },
    { unknown: true },
    { draft: 'yes' },
  ])('rejects invalid album fields %o', fields => {
    expect(
      albumFrontMatterSchema.safeParse({ ...album, ...fields }).success
    ).toBe(false)
  })
})

describe('photoFrontMatterSchema', () => {
  const PHOTO = 'photos/coast/low-sun.md'
  const validPhoto = {
    title: 'Low sun',
    taken: '2026-11-08',
    image: 'media:photos/low-sun.jpg',
    alt: 'A pale sun low over a violet sea.',
  }

  it('applies defaults and leaves the optional fields out', () => {
    expect(validate(photoFrontMatterSchema, validPhoto, PHOTO)).toEqual({
      ...validPhoto,
      draft: false,
    })
  })

  it('accepts every optional field', () => {
    const photo = {
      ...validPhoto,
      location: 'Exampleton, west pier',
      camera: 'Example R1',
      lens: '35 mm ƒ/2',
      focalLength: '35 mm',
      aperture: 'ƒ/2.8',
      shutter: '1/250 s',
      iso: '200',
      draft: true,
    }
    expect(validate(photoFrontMatterSchema, photo, PHOTO)).toEqual(photo)
  })

  it('accepts numeric ISO and photos without taken', () => {
    expect(photoFrontMatterSchema.parse({ ...validPhoto, iso: 200 }).iso).toBe(
      '200'
    )
    expect(
      photoFrontMatterSchema.parse({ ...validPhoto, taken: undefined }).taken
    ).toBeUndefined()
  })

  it('accepts a date or local minute timestamp', () => {
    expect(
      photoFrontMatterSchema.parse({ ...validPhoto, taken: '2026-11-08 18:42' })
        .taken
    ).toBe('2026-11-08 18:42')
  })

  it('asks for alt text when it is missing', () => {
    const error = errorOf(() =>
      validate(photoFrontMatterSchema, { ...validPhoto, alt: undefined }, PHOTO)
    )
    expect(error.message).toBe(
      'photos/coast/low-sun.md: alt: Required: describe what the photo shows'
    )
  })

  it.each([
    ['alt', '   ', 'alt: Must not be empty'],
    ['title', '', 'title: Must not be empty'],
    ['image', 'photos/low-sun.jpg', 'image: Expected a media reference'],
    ['image', 'https://example.com/a.jpg', 'image: Expected a media reference'],
    ['taken', '8 Nov 2026', 'taken: Expected YYYY-MM-DD or YYYY-MM-DD HH:mm'],
    ['taken', '2026-02-30', 'taken: '],
    ['taken', '2026-11-08 24:00', 'taken: '],
    ['taken', '2026-11-08 18:00 extra', 'taken: '],
    ['camera', '', 'camera: Must not be empty'],
    ['aperture', 2.8, 'aperture: '],
    ['draft', 'no', 'draft: '],
  ])('names the file and the field for an invalid %s', (field, value, msg) => {
    const error = errorOf(() =>
      validate(photoFrontMatterSchema, { ...validPhoto, [field]: value }, PHOTO)
    )
    expect(error.message).toContain(`photos/coast/low-sun.md: ${msg}`)
  })

  it('rejects unknown fields, each on its own line', () => {
    const error = errorOf(() =>
      validate(
        photoFrontMatterSchema,
        { ...validPhoto, caption: 'Hi', exposure: 'old' },
        PHOTO
      )
    )
    expect(error.message.split('\n')).toEqual([
      'photos/coast/low-sun.md: caption: Unknown field',
      'photos/coast/low-sun.md: exposure: Unknown field',
    ])
  })
})

describe('projectFrontMatterSchema', () => {
  const PROJECT = 'projects/demo.md'
  const validProject = {
    title: 'Demo',
    description: 'A demo project.',
    stack: ['TypeScript'],
  }

  it('applies defaults and turns a numeric year into a string', () => {
    expect(
      validate(
        projectFrontMatterSchema,
        { ...validProject, year: 2024 },
        PROJECT
      )
    ).toEqual({ ...validProject, year: '2024', featured: false, order: 100 })
  })

  it('accepts every optional field', () => {
    const project = {
      ...validProject,
      year: '2023–2024',
      status: 'archived',
      url: 'https://example.com',
      repo: 'https://example.com/repo',
      image: 'media:projects/demo.png',
      featured: true,
      order: 1,
    }
    expect(validate(projectFrontMatterSchema, project, PROJECT)).toEqual(
      project
    )
  })

  it.each([
    ['image', 'https://example.com/a.png', 'image: Expected a media reference'],
    ['image', 'media:../secret.png', 'image: Expected a media reference'],
    ['url', 'ftp://example.com', 'url: Expected an http(s) URL'],
    ['status', 'done', 'status: '],
  ])('names the file and the field for an invalid %s', (field, value, msg) => {
    const error = errorOf(() =>
      validate(
        projectFrontMatterSchema,
        { ...validProject, [field]: value },
        PROJECT
      )
    )
    expect(error.message).toContain(`projects/demo.md: ${msg}`)
  })
})

describe('profileSchema', () => {
  const FILE_NAME = 'profile.yaml'
  const validProfile = {
    name: 'Avery Example',
    role: 'Web developer',
    location: 'Exampleton',
    bio: 'Writes about the web.',
    intro: { headline: 'Hi.', detail: 'More.', paragraphs: ['One.'] },
    links: [
      { label: 'Email', href: 'mailto:avery@example.com' },
      { label: 'Site', href: 'https://example.com' },
    ],
    stack: [{ group: 'Languages', items: ['TypeScript'] }],
    experience: [
      {
        start: 2024,
        role: 'Developer',
        organization: 'Example Co',
        summary: 'Built things.',
      },
    ],
  }

  it('accepts a valid profile and stringifies years', () => {
    const profile = validate(profileSchema, validProfile, FILE_NAME)
    expect(profile.experience[0]?.start).toBe('2024')
  })

  const nestedEntry = {
    start: '2026-02',
    role: 'Developer',
    organization: 'Example Co',
    note: 'Fictional team · Contract',
    summary: 'Built sample tools.',
    projects: [
      {
        start: '2026-11',
        title: 'Sample editor',
        role: 'Developer',
        summary: 'Builds sample editing tools.',
      },
      {
        start: 2025,
        end: '2026-10',
        title: 'Example library',
        role: 'Developer → Reviewer',
        summary: 'Reviewed example components.',
      },
    ],
  }

  it('accepts nested projects and a note, preserving the written order', () => {
    const profile = validate(
      profileSchema,
      { ...validProfile, experience: [nestedEntry] },
      FILE_NAME
    )
    expect(profile.experience).toEqual([
      {
        ...nestedEntry,
        projects: [
          nestedEntry.projects[0],
          { ...nestedEntry.projects[1], start: '2025' },
        ],
      },
    ])
  })

  it.each(['2026-00', '2026-13', '2026-2', '26', '2026-02-01', 26])(
    'rejects invalid dates at both levels and names the value %j',
    value => {
      for (const field of ['start', 'end'] as const) {
        const topLevel = errorOf(() =>
          validate(
            profileSchema,
            {
              ...validProfile,
              experience: [{ ...nestedEntry, [field]: value }],
            },
            FILE_NAME
          )
        )
        expect(topLevel.message).toBe(
          `profile.yaml: experience[0].${field}: Invalid experience date "${value}", expected YYYY or YYYY-MM (month 01–12)`
        )

        const nested = errorOf(() =>
          validate(
            profileSchema,
            {
              ...validProfile,
              experience: [
                {
                  ...nestedEntry,
                  projects: [{ ...nestedEntry.projects[0], [field]: value }],
                },
              ],
            },
            FILE_NAME
          )
        )
        expect(nested.message).toBe(
          `profile.yaml: experience[0].projects[0].${field}: Invalid experience date "${value}", expected YYYY or YYYY-MM (month 01–12)`
        )
      }
    }
  )

  it('rejects unknown keys on entries and nested projects', () => {
    const error = errorOf(() =>
      validate(
        profileSchema,
        {
          ...validProfile,
          experience: [
            {
              ...nestedEntry,
              extra: true,
              projects: [{ ...nestedEntry.projects[0], extra: true }],
            },
          ],
        },
        FILE_NAME
      )
    )
    expect(error.message).toContain(
      'profile.yaml: experience[0].extra: Unknown field'
    )
    expect(error.message).toContain(
      'profile.yaml: experience[0].projects[0].extra: Unknown field'
    )
  })

  it('accepts site-relative link paths', () => {
    const links = [{ label: 'RSS', href: '/rss.xml' }]
    expect(
      validate(profileSchema, { ...validProfile, links }, FILE_NAME).links
    ).toEqual(links)
  })

  it.each(['javascript:alert(1)', '//evil.example', 'rss.xml', '/a b'])(
    'names nested fields with their index for the link %j',
    href => {
      const error = errorOf(() =>
        validate(
          profileSchema,
          { ...validProfile, links: [{ label: 'Bad', href }] },
          FILE_NAME
        )
      )
      expect(error.message).toBe(
        'profile.yaml: links[0].href: Expected an http(s) or mailto: URL, or a path starting with /'
      )
    }
  )

  it('reports a missing section', () => {
    const error = errorOf(() =>
      validate(profileSchema, { ...validProfile, intro: undefined }, FILE_NAME)
    )
    expect(error.message).toMatch(/^profile\.yaml: intro: /)
  })
})
