import 'server-only'

import { z } from 'zod'

import { admitEntry } from '@/lib/content/admission'
import { InvalidSnapshot } from '@/lib/content/snapshot-error'
export { InvalidSnapshot } from '@/lib/content/snapshot-error'
import {
  MAX_SNAPSHOT_BYTES,
  MAX_TEXT_BYTES,
  MAX_TEXT_FILES,
  shaSchema,
  type TextSnapshot,
} from '@/lib/content/snapshot'

const treeSchema = z.object({
  sha: shaSchema,
  truncated: z.boolean(),
  tree: z.array(
    z.object({
      path: z.string(),
      mode: z.string(),
      type: z.enum(['blob', 'tree', 'commit']),
      sha: shaSchema,
      size: z.number().int().nonnegative().optional(),
    })
  ),
})
const commitSchema = z.object({
  sha: shaSchema,
  commit: z.object({ tree: z.object({ sha: shaSchema }) }),
})
const blobSchema = z.object({
  encoding: z.literal('base64'),
  size: z.number().int().nonnegative().max(MAX_TEXT_BYTES),
  content: z.string(),
})

export class GitHubUnavailable extends Error {
  constructor() {
    super('github_unavailable')
  }
}
export class MediaChanged extends Error {
  constructor() {
    super('deploy_required')
  }
}

export interface GitHubClientOptions {
  repo: string
  ref: string
  token: string
  apiUrl: string
  fetcher?: typeof fetch
}

/** Reads only pinned text trees/blobs; the moving ref is never HTTP-cached. */
export function createGitHubClient({
  repo,
  ref,
  token,
  apiUrl,
  fetcher = fetch,
}: GitHubClientOptions) {
  let active = 0
  let blockedUntil = 0
  const waiting: (() => void)[] = []
  async function request(
    endpoint: string,
    signal: AbortSignal,
    immutable = true,
    file?: string
  ): Promise<unknown> {
    if (active >= 4) await new Promise<void>(resolve => waiting.push(resolve))
    active++
    try {
      signal.throwIfAborted()
      if (Date.now() < blockedUntil) throw new GitHubUnavailable()
      const response = await fetcher(`${apiUrl}/repos/${repo}/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        cache: immutable ? 'force-cache' : 'no-store',
        redirect: 'error',
        signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]),
      })
      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
          const retry = Number(response.headers.get('retry-after')) || 60
          const reset = Number(response.headers.get('x-ratelimit-reset')) * 1000
          blockedUntil = Math.max(
            Date.now() + retry * 1000,
            Number.isFinite(reset) ? reset : 0
          )
        }
        await response.body?.cancel()
        throw new GitHubUnavailable()
      }
      const reader = response.body?.getReader()
      if (!reader) throw new GitHubUnavailable()
      let size = 0
      const chunks: Uint8Array[] = []
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 8 * MAX_TEXT_BYTES) {
          await reader.cancel()
          throw new InvalidSnapshot('response_too_large', file)
        }
        chunks.push(value)
      }
      try {
        return JSON.parse(
          new TextDecoder('utf-8', { fatal: true }).decode(
            Buffer.concat(chunks)
          )
        ) as unknown
      } catch {
        throw new InvalidSnapshot('invalid_json', file)
      }
    } catch (error) {
      if (
        error instanceof InvalidSnapshot ||
        error instanceof GitHubUnavailable
      )
        throw error
      throw new GitHubUnavailable()
    } finally {
      active--
      waiting.shift()?.()
    }
  }

  async function loadHead(
    expectedMediaTree: string | null
  ): Promise<TextSnapshot> {
    const signal = AbortSignal.timeout(10_000)
    const commit = commitSchema.safeParse(
      await request(`commits/${encodeURIComponent(ref)}`, signal, false)
    )
    if (!commit.success) throw new InvalidSnapshot('invalid_commit')
    async function tree(sha: string, recursive = false, prefix?: string) {
      const parsed = treeSchema.safeParse(
        await request(
          `git/trees/${sha}${recursive ? '?recursive=1' : ''}`,
          signal,
          true,
          prefix
        )
      )
      if (!parsed.success) throw new InvalidSnapshot('invalid_tree', prefix)
      return parsed.data
    }
    const root = await tree(commit.data.commit.tree.sha)
    if (root.truncated) throw new InvalidSnapshot('truncated_tree')
    const rootNames = new Set<string>()
    for (const item of root.tree) {
      if (rootNames.has(item.path))
        throw new InvalidSnapshot('duplicate_path', item.path)
      rootNames.add(item.path)
    }
    const media = root.tree.find(item => item.path === 'media')
    if (media && (media.type !== 'tree' || media.mode !== '040000'))
      throw new InvalidSnapshot('unsupported_entry', 'media')
    if ((media?.sha ?? null) !== expectedMediaTree) throw new MediaChanged()
    const blobs: { path: string; sha: string; size?: number }[] = []
    const seen = new Set<string>()
    function admit(
      path: string,
      item: z.infer<typeof treeSchema>['tree'][number]
    ) {
      const kind = admitEntry(
        path,
        item.type === 'tree' && item.mode === '040000'
          ? 'directory'
          : item.type === 'blob' && ['100644', '100755'].includes(item.mode)
            ? 'file'
            : 'unsupported',
        item.size
      )
      if (seen.has(path)) throw new InvalidSnapshot('duplicate_path', path)
      seen.add(path)
      if (kind !== 'text') return
      blobs.push({ path, sha: item.sha, size: item.size })
      if (blobs.length > MAX_TEXT_FILES)
        throw new InvalidSnapshot('too_many_files', path)
    }
    async function visit(
      prefix: string,
      sha: string,
      recursive = true
    ): Promise<void> {
      const result = await tree(sha, recursive, prefix)
      if (result.truncated) {
        if (!recursive) throw new InvalidSnapshot('truncated_tree', prefix)
        return visit(prefix, sha, false)
      }
      for (const item of result.tree) {
        const path = `${prefix}/${item.path}`
        admit(path, item)
        if (!recursive && item.type === 'tree') await visit(path, item.sha)
      }
    }
    for (const item of root.tree) {
      if (item.path === 'profile.yaml') admit(item.path, item)
      if (['writing', 'photos', 'projects'].includes(item.path)) {
        if (item.type !== 'tree' || item.mode !== '040000')
          throw new InvalidSnapshot('unsupported_entry', item.path)
        await visit(item.path, item.sha)
      }
    }
    const files: Record<string, string> = Object.create(null) as Record<
      string,
      string
    >
    let total = 0
    // Workers, not one Promise per blob: large trees cannot create an unbounded queue.
    let cursor = 0
    await Promise.all(
      Array.from({ length: 4 }, async () => {
        for (;;) {
          const blob = blobs[cursor++]
          if (!blob) return
          const parsed = blobSchema.safeParse(
            await request(`git/blobs/${blob.sha}`, signal, true, blob.path)
          )
          if (
            !parsed.success ||
            !/^[A-Za-z0-9+/=\r\n]*$/.test(parsed.data.content)
          )
            throw new InvalidSnapshot('invalid_blob', blob.path)
          const bytes = Buffer.from(parsed.data.content, 'base64')
          if (
            bytes.length !== parsed.data.size ||
            (blob.size !== undefined && bytes.length !== blob.size)
          )
            throw new InvalidSnapshot('blob_size_mismatch', blob.path)
          total += bytes.length
          if (total > MAX_SNAPSHOT_BYTES)
            throw new InvalidSnapshot('text_budget_exceeded', blob.path)
          try {
            files[blob.path] = new TextDecoder('utf-8', { fatal: true }).decode(
              bytes
            )
          } catch {
            throw new InvalidSnapshot('invalid_utf8', blob.path)
          }
        }
      })
    )
    return {
      version: 1,
      revision: commit.data.sha,
      mediaTree: media?.sha ?? null,
      files,
    }
  }
  return { loadHead }
}
