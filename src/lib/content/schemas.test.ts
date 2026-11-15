import { describe, expect, it } from 'vitest'

import { ContentError } from '@/lib/content/content-error'
import {
  normalizeTag,
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

  it('names nested fields with their index', () => {
    const error = errorOf(() =>
      validate(
        profileSchema,
        {
          ...validProfile,
          links: [{ label: 'Bad', href: 'javascript:alert(1)' }],
        },
        FILE_NAME
      )
    )
    expect(error.message).toBe(
      'profile.yaml: links[0].href: Expected an http(s) or mailto: URL'
    )
  })

  it('reports a missing section', () => {
    const error = errorOf(() =>
      validate(profileSchema, { ...validProfile, intro: undefined }, FILE_NAME)
    )
    expect(error.message).toMatch(/^profile\.yaml: intro: /)
  })
})
