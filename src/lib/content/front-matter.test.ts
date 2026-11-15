import { describe, expect, it } from 'vitest'

import { ContentError } from '@/lib/content/content-error'
import { splitFrontMatter } from '@/lib/content/front-matter'

const FILE = 'notes/demo/index.md'

describe('splitFrontMatter', () => {
  it('parses the YAML and keeps body lines where they were', () => {
    const source = '---\ntitle: Demo\ndate: 2026-11-15\n---\n\n# Body\n'
    const { data, body } = splitFrontMatter(source, FILE)
    expect(data).toEqual({ title: 'Demo', date: '2026-11-15' })
    expect(body.split('\n')[5]).toBe('# Body')
    expect(source.split('\n')[5]).toBe('# Body')
  })

  it('handles Windows line endings and a byte order mark', () => {
    const { data, body } = splitFrontMatter(
      '\uFEFF---\r\ntitle: Demo\r\n---\r\nText\r\n',
      FILE
    )
    expect(data).toEqual({ title: 'Demo' })
    expect(body.trim()).toBe('Text')
  })

  it('treats empty front matter as an empty object', () => {
    expect(splitFrontMatter('---\n---\nText', FILE).data).toEqual({})
  })

  it('throws, naming the file, when the front matter is missing', () => {
    expect(() => splitFrontMatter('# Just a heading\n', FILE)).toThrow(
      new ContentError(
        'notes/demo/index.md: Missing front matter; the file must start with a --- block'
      )
    )
  })

  it('throws, naming the file, when the YAML is malformed', () => {
    expect(() =>
      splitFrontMatter('---\ntitle: [unclosed\n---\n', FILE)
    ).toThrow(/^notes\/demo\/index\.md: Invalid YAML: /)
  })

  it('rejects duplicate keys', () => {
    expect(() =>
      splitFrontMatter('---\ntitle: A\ntitle: B\n---\n', FILE)
    ).toThrow(/^notes\/demo\/index\.md: Invalid YAML: /)
  })
})
