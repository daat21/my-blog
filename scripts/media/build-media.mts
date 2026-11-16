// Processes the media files of the content directory into public/_media/
// and writes .media/manifest.json, which the site reads to resolve
// `media:` references. Runs before `next build` and `next dev`.
//
// Usage: node scripts/media/build-media.mts

import path from 'node:path'

import { MEDIA_CACHE_DIR } from './cache.mts'
import { isNotFound } from './files.mts'
import { buildMedia } from './pipeline.mts'

const DEFAULT_CONTENT_DIR = 'content-example'

const repoRoot = path.resolve(import.meta.dirname, '..', '..')

// Next.js reads CONTENT_DIR from these files as well, so load them to make
// sure both see the same content. Variables that are already set win, and
// .env.local wins over .env, as in Next.js.
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(path.join(repoRoot, file))
  } catch (error) {
    if (!isNotFound(error)) throw error
  }
}

// Same default and base directory as the site's environment validation.
const contentDir = path.resolve(
  repoRoot,
  process.env.CONTENT_DIR ?? DEFAULT_CONTENT_DIR
)
const manifestPath = path.join(repoRoot, '.media', 'manifest.json')
const started = performance.now()

try {
  const { manifest, processed, skipped, removed } = await buildMedia({
    mediaRoot: path.join(contentDir, 'media'),
    output: {
      dir: path.join(repoRoot, 'public', '_media'),
      publicPath: '/_media',
    },
    manifestPath,
    cacheDir: path.join(repoRoot, MEDIA_CACHE_DIR),
    log: message => {
      console.log(message)
    },
  })
  const seconds = ((performance.now() - started) / 1000).toFixed(1)
  console.log(
    `media: ${Object.keys(manifest.items).length} sources, ` +
      `${skipped.length} cached, ${processed.length} processed, ` +
      `${removed.length} stale outputs removed, in ${seconds} s. ` +
      `Wrote ${path.relative(repoRoot, manifestPath)}.`
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
