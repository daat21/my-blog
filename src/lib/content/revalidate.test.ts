import { createHmac } from 'node:crypto'

import { describe, expect, it, vi } from 'vitest'

import {
  GitHubUnavailable,
  InvalidSnapshot,
  MediaChanged,
} from '@/lib/content/github-client'
import { SnapshotRejected } from '@/lib/content/github-source'
import { handleRevalidation } from '@/lib/content/revalidate'

const secret = 'a'.repeat(64)
const now = 1_800_000_000
const body = {
  version: 1,
  timestamp: now,
  repository: 'example/content',
  ref: 'main',
  before: 'b'.repeat(40),
  after: 'c'.repeat(40),
  paths: ['writing/example/index.md'],
}
function request(data: unknown = body, signature?: string) {
  const raw = typeof data === 'string' ? data : JSON.stringify(data)
  return new Request('http://localhost:3220/api/revalidate', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-content-signature':
        signature ??
        `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`,
    },
    body: raw,
  })
}
function options() {
  return {
    secret,
    repo: 'example/content',
    ref: 'main',
    now: () => now * 1000,
    preflight: vi.fn(() => Promise.resolve({ revision: 'd'.repeat(40) })),
    expire: vi.fn(),
  }
}

describe('signed revalidation', () => {
  it('expires exactly mapped tags after CURRENT HEAD validation, even for a newer revision', async () => {
    const o = options()
    const response = await handleRevalidation(request(), o)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      code: 'revalidated',
      revalidated: true,
      revision: 'd'.repeat(40),
      tags: ['post:example', 'posts', 'tags'],
    })
    expect(o.expire.mock.calls).toEqual([['post:example'], ['posts'], ['tags']])
    expect(o.preflight).toHaveBeenCalledOnce()
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
  it.each([
    'sha256=abcd',
    `sha256=${'A'.repeat(64)}`,
    `sha256=${'0'.repeat(64)}`,
    '',
  ])('rejects signature %s without preflight', async signature => {
    const o = options()
    expect((await handleRevalidation(request(body, signature), o)).status).toBe(
      401
    )
    expect(o.preflight).not.toHaveBeenCalled()
    expect(o.expire).not.toHaveBeenCalled()
  })
  it('signs exact raw bytes rather than normalized JSON', async () => {
    const raw = JSON.stringify(body)
    const sig = `sha256=${createHmac('sha256', secret).update(raw).digest('hex')}`
    expect(
      (await handleRevalidation(request(`${raw} `, sig), options())).status
    ).toBe(401)
  })
  it.each([-301, 301])('rejects timestamp skew %s', async skew => {
    expect(
      (
        await handleRevalidation(
          request({ ...body, timestamp: now + skew }),
          options()
        )
      ).status
    ).toBe(401)
  })
  it.each([-300, 300])(
    'accepts timestamp boundary %s and idempotent replay',
    async skew => {
      const o = options()
      for (let i = 0; i < 2; i++)
        expect(
          (
            await handleRevalidation(
              request({ ...body, timestamp: now + skew }),
              o
            )
          ).status
        ).toBe(200)
    }
  )
  it.each([
    { repository: 'wrong/repo' },
    { ref: 'other' },
    { tags: ['profile'] },
    { paths: ['../profile.yaml'] },
    { paths: Array.from({ length: 1001 }, () => 'README.md') },
  ])('rejects malformed authenticated payload %j', async change => {
    const o = options()
    expect(
      (await handleRevalidation(request({ ...body, ...change }), o)).status
    ).toBe(400)
    expect(o.expire).not.toHaveBeenCalled()
  })
  it('rejects malformed JSON, oversize and wrong type', async () => {
    expect((await handleRevalidation(request('{'), options())).status).toBe(400)
    expect(
      (await handleRevalidation(request('x'.repeat(65537)), options())).status
    ).toBe(413)
    const req = request()
    req.headers.set('content-type', 'text/plain')
    expect((await handleRevalidation(req, options())).status).toBe(415)
  })
  it('does not preflight media/unknown paths', async () => {
    const o = options()
    expect(
      (
        await handleRevalidation(
          request({ ...body, paths: ['media/new.jpg'] }),
          o
        )
      ).status
    ).toBe(409)
    expect(o.preflight).not.toHaveBeenCalled()
  })
  it.each([
    [new MediaChanged(), 409],
    [
      new SnapshotRejected('e'.repeat(40), [
        {
          code: 'validation_failed',
          message: 'Check the photo content.',
          path: 'photos/trip/photo.md',
          ref: 'media:missing/photo.jpg',
        },
      ]),
      422,
    ],
    [new InvalidSnapshot(), 422],
    [new GitHubUnavailable(), 503],
  ])(
    'leaves all tags intact after preflight failure',
    async (error, status) => {
      const o = options()
      o.preflight.mockRejectedValue(error)
      const response = await handleRevalidation(request(), o)
      expect(response.status).toBe(status)
      expect(o.expire).not.toHaveBeenCalled()
      expect(JSON.stringify(await response.json())).not.toContain(secret)
    }
  )
  it('reports actionable snapshot diagnostics only after authentication', async () => {
    const o = options()
    const error = new InvalidSnapshot('unsupported_path', 'writing/stray.txt')
    o.preflight.mockRejectedValue(error)
    const rejected = await handleRevalidation(request(), o)
    expect(rejected.status).toBe(422)
    expect(await rejected.json()).toEqual({
      code: 'invalid_content',
      issues: error.issues,
    })
    const unauthenticated = await handleRevalidation(
      request(body, `sha256=${'0'.repeat(64)}`),
      o
    )
    expect(await unauthenticated.json()).toEqual({ code: 'unauthorized' })
    expect(o.preflight).toHaveBeenCalledOnce()
    expect(o.expire).not.toHaveBeenCalled()
  })
  it('authenticates housekeeping no-ops and fails closed without settings', async () => {
    const o = options()
    expect(
      (await handleRevalidation(request({ ...body, paths: ['README.md'] }), o))
        .status
    ).toBe(200)
    expect(o.expire).not.toHaveBeenCalled()
    expect(
      (await handleRevalidation(request(), { ...o, secret: undefined })).status
    ).toBe(503)
  })
})
