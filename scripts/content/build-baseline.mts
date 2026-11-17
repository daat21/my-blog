import { mkdir, readFile, writeFile } from 'node:fs/promises'

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
await mkdir('.content-runtime', { recursive: true })
await writeFile(
  '.content-runtime/baseline.json',
  JSON.stringify({ version: 1, ...built, files })
)
console.log(
  `content:baseline: captured ${Object.keys(files).length} text files`
)
