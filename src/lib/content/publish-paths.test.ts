import { describe, expect, it } from 'vitest'

import { classifyPath, classifyPaths } from '@/lib/content/publish-paths'

describe('publish path classification', () => {
  it.each([
    ['profile.yaml', ['profile']],
    ['writing/example/index.md', ['post:example', 'posts', 'tags']],
    ['projects/example.md', ['projects']],
    ['photos/trip/index.md', ['album:trip', 'albums']],
    ['photos/trip/dawn.md', ['photo:trip/dawn', 'album:trip', 'albums']],
  ])('maps %s for additions, edits and deletions', (path, tags) => {
    expect(classifyPath(path)).toEqual({ kind: 'text', tags })
  })
  it.each([
    'media',
    'media/new.jpg',
    '/profile.yaml',
    '../profile.yaml',
    'writing/x/../index.md',
    'writing/x//index.md',
    'photos/icon/index.md',
    'photos/trip/icon.md',
    'writing/Upper/index.md',
    'writing/extra.md',
    'photos/trip/nested/photo.md',
    'unknown.yaml',
    'profile.yaml\n',
    'projects\\example.md',
    `photos/${'a'.repeat(250)}/photo.md`,
  ])('deploys or rejects ambiguous path %s', path => {
    expect(classifyPath(path).kind).toBe('deploy')
  })
  it.each([
    'README.md',
    '.gitignore',
    '.gitattributes',
    '.github/workflows/publish.yml',
  ])('recognizes housekeeping %s', path => {
    expect(classifyPath(path)).toEqual({ kind: 'ignore', tags: [] })
  })
  it('deduplicates both sides of renames and never partially publishes mixed pushes', () => {
    expect(
      classifyPaths([
        'writing/old/index.md',
        'writing/new/index.md',
        'writing/new/index.md',
      ])
    ).toEqual({
      deploy: false,
      tags: ['post:new', 'post:old', 'posts', 'tags'],
    })
    expect(classifyPaths(['profile.yaml', 'media/photo.jpg'])).toEqual({
      deploy: true,
      tags: [],
    })
  })
})
