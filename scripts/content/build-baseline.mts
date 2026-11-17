import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { registerHooks } from 'node:module'

import { z } from 'zod'

import { collectTextFiles } from '../../src/lib/content/file-snapshot.ts'
import { env } from '../../src/lib/env.ts'

const metadata = z.strictObject({
  revision: z.string().regex(/^[a-f0-9]{40}$/),
  mediaTree: z
    .string()
    .regex(/^[a-f0-9]{40}$/)
    .nullable(),
})
const built =
  env.content.source === 'github'
    ? metadata.parse(
        JSON.parse(
          await readFile('.content-runtime/checkout.json', 'utf8')
        ) as unknown
      )
    : { revision: '0'.repeat(40), mediaTree: null }
const files = await collectTextFiles(env.contentDir)
// Native Node cannot resolve the application's @/ aliases or extensionless TS imports.
// Keep this hook local to the build script; reuse the actual validator, not a second parser.
const src = new URL('../../src/', import.meta.url)
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/'))
      return next(new URL(`${specifier.slice(2)}.ts`, src).href, context)
    if (
      context.parentURL?.startsWith(src.href) &&
      specifier.startsWith('.') &&
      !/\.[a-z]+$/.test(specifier)
    )
      return next(`${specifier}.ts`, context)
    return next(specifier, context)
  },
})
const { validateSnapshot } = await import('../../src/lib/content/snapshot.ts')
const { createLocalMediaResolver } =
  await import('../../src/lib/media/local-media-resolver.ts')
await validateSnapshot(
  { version: 1, ...built, files },
  createLocalMediaResolver({ manifestPath: '.media/manifest.json' })
)
await mkdir('.content-runtime', { recursive: true })
await writeFile(
  '.content-runtime/baseline.json',
  JSON.stringify({ version: 1, ...built, files })
)
console.log(
  `content:baseline: captured ${Object.keys(files).length} text files`
)
