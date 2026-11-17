import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { createFileSystemSource } from '@/lib/content/file-system-source'
import { createGitHubSource } from '@/lib/content/github-source'
import { env } from '@/lib/env'
import { getMediaResolver, type MediaResolver } from '@/lib/media'

let mediaResolver: MediaResolver | undefined
const media: MediaResolver = {
  resolve: ref => (mediaResolver ??= getMediaResolver()).resolve(ref),
}
const filesystem = createFileSystemSource({
  contentDir: env.contentDir,
  showDrafts: env.showDrafts,
  media,
})
const settings = env.content
const github =
  settings.source === 'github' && settings.repo && settings.token
    ? createGitHubSource({
        repo: settings.repo,
        token: settings.token,
        ref: settings.ref,
        apiUrl: settings.apiUrl,
        isBuild: settings.isBuild,
        showDrafts: env.showDrafts,
        media,
        baseline: async () =>
          JSON.parse(
            await readFile(
              path.join(process.cwd(), '.content-runtime', 'baseline.json'),
              'utf8'
            )
          ) as unknown,
        report: event => {
          console.error('content_snapshot_fallback', event)
        },
      })
    : undefined

/** Selects the source behind the cached content accessors. */
export async function selectContent() {
  return github ? github.select() : { source: filesystem, degraded: false }
}

/** Fully validates current HEAD without admitting an unsafe revision. */
export async function preflightCurrentContent() {
  if (!github) throw new Error('github_source_unavailable')
  return github.preflight()
}
