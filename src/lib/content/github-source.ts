import 'server-only'

import {
  createGitHubClient,
  GitHubUnavailable,
  MediaChanged,
} from '@/lib/content/github-client'
import type { GitHubClientOptions } from '@/lib/content/github-client'
import { createReaderSource } from '@/lib/content/reader-source'
import {
  snapshotReader,
  validateSnapshot,
  type TextSnapshot,
} from '@/lib/content/snapshot'
import type { MediaResolver } from '@/lib/media/types'

export class SnapshotRejected extends Error {
  constructor(
    public readonly revision: string | undefined,
    public readonly issues: { code: string; path?: string; ref?: string }[]
  ) {
    super('invalid_content')
  }
}

interface GitHubSourceOptions extends GitHubClientOptions {
  baseline: () => Promise<unknown>
  media: MediaResolver
  showDrafts: boolean
  isBuild: boolean
  report?: (event: {
    code: string
    revision?: string
    fallback?: string
    issues?: { code: string; path?: string; ref?: string }[]
  }) => void
}

/** Selects fully validated HEAD content or safe previous content without history walking. */
export function createGitHubSource(options: GitHubSourceOptions) {
  const client = createGitHubClient(options)
  const validated = new Map<string, TextSnapshot>()
  let baseline: Promise<TextSnapshot> | undefined
  let previous: TextSnapshot | undefined
  let pending: Promise<TextSnapshot> | undefined
  function loadBaseline() {
    baseline ??= options
      .baseline()
      .then(input => validateSnapshot(input, options.media))
      .catch((error: unknown) => {
        baseline = undefined
        throw error
      })
    return baseline
  }
  async function preflight(): Promise<TextSnapshot> {
    const built = await loadBaseline()
    const candidate = await client.loadHead(built.mediaTree)
    const known = validated.get(candidate.revision)
    if (known) {
      previous = known
      return known
    }
    try {
      const snapshot = await validateSnapshot(candidate, options.media)
      validated.set(snapshot.revision, snapshot)
      if (validated.size > 4) {
        const oldest = validated.keys().next().value
        if (oldest) validated.delete(oldest)
      }
      previous = snapshot
      return snapshot
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const path = Object.keys(candidate.files).find(file =>
        message.includes(file)
      )
      const ref = /media:[a-zA-Z0-9/._-]+/.exec(message)?.[0]?.slice(0, 256)
      throw new SnapshotRejected(candidate.revision, [
        {
          code: 'validation_failed',
          ...(path && { path }),
          ...(ref && { ref }),
        },
      ])
    }
  }
  async function select() {
    const built = await loadBaseline()
    let snapshot: TextSnapshot
    let degraded = false
    if (options.isBuild) snapshot = built
    else {
      try {
        pending ??= preflight().finally(() => {
          pending = undefined
        })
        snapshot = await pending
      } catch (error) {
        degraded = true
        snapshot = previous ?? built
        options.report?.({
          code:
            error instanceof MediaChanged
              ? 'deploy_required'
              : error instanceof GitHubUnavailable
                ? 'github_unavailable'
                : 'invalid_content',
          ...(error instanceof SnapshotRejected && {
            revision: error.revision,
            issues: error.issues,
          }),
          fallback: snapshot.revision,
        })
      }
    }
    return {
      source: createReaderSource({
        reader: snapshotReader(snapshot),
        showDrafts: options.showDrafts,
        media: options.media,
      }),
      degraded,
    }
  }
  return { select, preflight }
}
