import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

import { z } from 'zod'

import {
  GitHubUnavailable,
  InvalidSnapshot,
  MediaChanged,
} from '@/lib/content/github-client'
import { SnapshotRejected } from '@/lib/content/github-source'
import { classifyPaths, isContentPath } from '@/lib/content/publish-paths'
import { shaSchema } from '@/lib/content/snapshot'

const MAX_BODY = 64 * 1024
const bodySchema = z.strictObject({
  version: z.literal(1),
  timestamp: z.number().int().nonnegative(),
  repository: z.string(),
  ref: z.string(),
  before: shaSchema,
  after: shaSchema,
  paths: z.array(z.string().refine(isContentPath)).max(1000),
})
interface RevalidateOptions {
  secret?: string
  repo?: string
  ref: string
  now?: () => number
  preflight: () => Promise<{ revision: string }>
  expire: (tag: string) => void
}
function reply(status: number, data: unknown) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

/** Authenticates raw bytes and validates HEAD before expiring only supplied path dependencies. */
export async function handleRevalidation(
  request: Request,
  options: RevalidateOptions
): Promise<Response> {
  if (!options.secret || !options.repo)
    return reply(503, { code: 'unavailable' })
  if (
    request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !==
    'application/json'
  )
    return reply(415, { code: 'unsupported_type' })
  if (Number(request.headers.get('content-length')) > MAX_BODY)
    return reply(413, { code: 'too_large' })
  const reader = request.body?.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    if (reader)
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > MAX_BODY) {
          await reader.cancel()
          return reply(413, { code: 'too_large' })
        }
        chunks.push(value)
      }
  } catch {
    return reply(400, { code: 'bad_body' })
  }
  const raw = Buffer.concat(chunks)
  const signature = request.headers.get('x-content-signature')
  if (!signature || !/^sha256=[a-f0-9]{64}$/.test(signature))
    return reply(401, { code: 'unauthorized' })
  const expected = createHmac('sha256', options.secret).update(raw).digest()
  if (!timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex')))
    return reply(401, { code: 'unauthorized' })
  let json: unknown
  try {
    json = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(raw)
    ) as unknown
  } catch {
    return reply(400, { code: 'bad_body' })
  }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) return reply(400, { code: 'bad_body' })
  const body = parsed.data
  if (
    Math.abs(
      Math.floor((options.now?.() ?? Date.now()) / 1000) - body.timestamp
    ) > 300
  )
    return reply(401, { code: 'unauthorized' })
  if (body.repository !== options.repo || body.ref !== options.ref)
    return reply(400, { code: 'wrong_target' })
  const classified = classifyPaths(body.paths)
  if (classified.deploy) return reply(409, { code: 'deploy_required' })
  try {
    const head = await options.preflight()
    classified.tags.forEach(tag => {
      options.expire(tag)
    })
    return reply(200, {
      revalidated: true,
      revision: head.revision,
      tags: classified.tags,
    })
  } catch (error) {
    if (error instanceof MediaChanged)
      return reply(409, { code: 'deploy_required' })
    if (error instanceof SnapshotRejected)
      return reply(422, {
        code: 'invalid_content',
        revision: error.revision,
        issues: error.issues,
      })
    if (error instanceof InvalidSnapshot)
      return reply(422, {
        code: 'invalid_content',
        issues: [{ code: 'invalid_snapshot' }],
      })
    if (!(error instanceof GitHubUnavailable))
      console.error('content_revalidation_unavailable')
    return reply(503, { code: 'unavailable' })
  }
}
