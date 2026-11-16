import { describe, expect, it } from 'vitest'

import { contentSettings } from '@/lib/env'

const github = {
  CONTENT_REPO: 'example/content',
  CONTENT_REPO_TOKEN: 'fake-token',
}
describe('runtime content settings', () => {
  it('keeps local/test/credential-free production builds on files', () => {
    for (const NODE_ENV of ['development', 'test', 'production'])
      expect(contentSettings({ NODE_ENV }).source).toBe('filesystem')
    expect(contentSettings(github).source).toBe('filesystem')
  })
  it('selects GitHub on Vercel and permits an explicit rollback', () => {
    for (const VERCEL_ENV of ['production', 'preview']) {
      expect(contentSettings({ ...github, VERCEL_ENV }).source).toBe('github')
      expect(() => contentSettings({ VERCEL_ENV })).toThrow()
    }
    expect(
      contentSettings({
        VERCEL_ENV: 'production',
        CONTENT_SOURCE: 'filesystem',
      }).source
    ).toBe('filesystem')
  })
  it('allows only loopback rehearsal origins outside Vercel', () => {
    expect(
      contentSettings({ CONTENT_GITHUB_API_URL: 'http://127.0.0.1:3221' })
        .apiUrl
    ).toBe('http://127.0.0.1:3221')
    for (const CONTENT_GITHUB_API_URL of [
      'https://example.com',
      'http://127.0.0.1:3221/path',
      'http://user:pass@localhost:3221',
      'http://localhost:3221?token=x',
    ])
      expect(() => contentSettings({ CONTENT_GITHUB_API_URL })).toThrow()
    expect(() =>
      contentSettings({
        ...github,
        VERCEL_ENV: 'preview',
        CONTENT_GITHUB_API_URL: 'http://127.0.0.1:3221',
      })
    ).toThrow()
  })
  it('validates repo/secret and recognizes the build phase', () => {
    expect(() => contentSettings({ CONTENT_REPO: '../escape' })).toThrow()
    expect(() =>
      contentSettings({ CONTENT_REVALIDATE_SECRET: 'short' })
    ).toThrow()
    expect(
      contentSettings({ NEXT_PHASE: 'phase-production-build' }).isBuild
    ).toBe(true)
  })
})
