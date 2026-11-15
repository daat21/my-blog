import { describe, expect, it } from 'vitest'

import { isExternalHref } from './external-href'

describe('isExternalHref', () => {
  it.each([
    'https://example.com',
    'http://example.com/path',
    'HTTPS://EXAMPLE.COM',
    '//cdn.example.com/file.js',
  ])('treats %s as external', href => {
    expect(isExternalHref(href)).toBe(true)
  })

  it.each([
    '/writing/a-post',
    '#section',
    'relative/path',
    'mailto:me@example.com',
  ])('treats %s as internal', href => {
    expect(isExternalHref(href)).toBe(false)
  })
})
