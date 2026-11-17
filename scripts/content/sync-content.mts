/**
 * Fetches the private content repository before a build.
 *
 * Runs only when CONTENT_REPO (for example `owner/blog-content`) and
 * CONTENT_REPO_TOKEN (a read-only fine-grained token) are set, which is the
 * case on Vercel. Everywhere else it does nothing and the build uses
 * CONTENT_DIR, which defaults to the bundled sample content.
 *
 * The token is passed as an HTTP header, never in the clone URL, so it cannot
 * leak into error messages or the repository's git config.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { env } from '../../src/lib/env.ts'

const { repo, token, ref } = env.content
const target = env.contentDir

if (!repo || !token) {
  console.log(
    'content:sync: CONTENT_REPO or CONTENT_REPO_TOKEN not set; using CONTENT_DIR as is.'
  )
  process.exit(0)
}

if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
  console.error(`content:sync: CONTENT_REPO must look like owner/name.`)
  process.exit(1)
}

const relativeTarget = path.relative(process.cwd(), target)
if (
  !relativeTarget ||
  relativeTarget.startsWith('..') ||
  execFileSync('git', ['ls-files', '--', relativeTarget], {
    encoding: 'utf8',
  }).trim()
) {
  console.error(
    'content:sync: CONTENT_DIR must be an untracked directory inside the project.'
  )
  process.exit(1)
}

if (existsSync(target)) rmSync(target, { recursive: true, force: true })

const basic = Buffer.from(`x-access-token:${token}`).toString('base64')

try {
  execFileSync(
    'git',
    [
      '-c',
      `http.extraheader=AUTHORIZATION: basic ${basic}`,
      'clone',
      '--depth=1',
      '--single-branch',
      `--branch=${ref}`,
      `https://github.com/${repo}.git`,
      target,
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  )
} catch {
  // Do not print git's stderr: keep any credential detail out of build logs.
  console.error(
    `content:sync: could not clone ${repo}@${ref}. Check CONTENT_REPO, CONTENT_REPO_REF and that the token can read the repository.`
  )
  process.exit(1)
}

const revision = execFileSync('git', ['-C', target, 'rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim()
let mediaTree: string | null = null
try {
  mediaTree = execFileSync(
    'git',
    ['-C', target, 'rev-parse', '--verify', 'HEAD:media'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
  ).trim()
} catch {
  /* A repository without media has no media tree. */
}
mkdirSync('.content-runtime', { recursive: true })
writeFileSync(
  '.content-runtime/checkout.json',
  JSON.stringify({ revision, mediaTree })
)
rmSync(path.join(target, '.git'), { recursive: true, force: true })
console.log(`content:sync: fetched ${repo}@${ref} into ${target}`)
