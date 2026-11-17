import { InvalidSnapshot } from './snapshot-error.ts'

export const MAX_TEXT_BYTES = 1024 * 1024
export const MAX_SNAPSHOT_BYTES = 16 * MAX_TEXT_BYTES
export const MAX_TEXT_FILES = 10_000
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const RESERVED = new Set([
  'index',
  'opengraph-image',
  'twitter-image',
  'icon',
  'apple-icon',
  'favicon',
  'robots',
  'sitemap',
  'manifest',
])
const HOUSEKEEPING = new Set([
  'README.md',
  '.gitignore',
  '.gitattributes',
  '.github/workflows/publish.yml',
])
const ROOTS = new Set(['writing', 'photos', 'projects'])
const photoSlug = (name: string) => SLUG.test(name) && !RESERVED.has(name)

/** Whether a path is a canonical repository-relative POSIX path. */
export function isContentPath(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= 1024 &&
    !path.includes('\\') &&
    !Array.from(path).some(
      char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127
    ) &&
    path.split('/').every(part => part !== '' && part !== '.' && part !== '..')
  )
}

/** Matches only the two regular placeholder file names inside content collections. */
export function isPlaceholder(path: string): boolean {
  const parts = path.split('/')
  return (
    isContentPath(path) &&
    ROOTS.has(parts[0] ?? '') &&
    parts.length > 1 &&
    ['.gitkeep', '.DS_Store'].includes(parts.at(-1) ?? '')
  )
}

/** Maps an added, changed or deleted repository path to its cache dependencies. */
export function classifyPath(path: string): {
  kind: 'text' | 'ignore' | 'deploy'
  tags: string[]
} {
  if (!isContentPath(path)) return { kind: 'deploy', tags: [] }
  if (HOUSEKEEPING.has(path) || isPlaceholder(path))
    return { kind: 'ignore', tags: [] }
  const parts = path.split('/')
  const [folder, name, file] = parts
  let tags: string[] | undefined
  if (path === 'profile.yaml') tags = ['profile']
  if (
    folder === 'writing' &&
    parts.length === 3 &&
    name &&
    SLUG.test(name) &&
    file === 'index.md'
  )
    tags = [`post:${name}`, 'posts', 'tags']
  if (
    folder === 'projects' &&
    parts.length === 2 &&
    name?.endsWith('.md') &&
    SLUG.test(name.slice(0, -3))
  )
    tags = ['projects']
  if (
    folder === 'photos' &&
    parts.length === 3 &&
    name &&
    photoSlug(name) &&
    file?.endsWith('.md')
  ) {
    if (file === 'index.md') tags = [`album:${name}`, 'albums']
    else if (photoSlug(file.slice(0, -3)))
      tags = [`photo:${name}/${file.slice(0, -3)}`, `album:${name}`, 'albums']
  }
  return tags?.every(tag => tag.length <= 256)
    ? { kind: 'text', tags }
    : { kind: 'deploy', tags: [] }
}

/** Classifies an entire push without accepting caller-supplied tags. */
export function classifyPaths(paths: readonly string[]) {
  const tags = new Set<string>()
  for (const path of paths) {
    const result = classifyPath(path)
    if (result.kind === 'deploy') return { deploy: true, tags: [] as string[] }
    result.tags.forEach(tag => tags.add(tag))
  }
  return { deploy: false, tags: [...tags].sort() }
}

/** Admits the same text entries from Git trees, local files and embedded snapshots. */
export function admitEntry(
  path: string,
  type: 'file' | 'directory' | 'unsupported',
  size?: number
): 'text' | 'ignore' | 'directory' {
  if (!isContentPath(path)) throw new InvalidSnapshot('invalid_path')
  if (type === 'unsupported')
    throw new InvalidSnapshot('unsupported_entry', path)
  if (type === 'directory') {
    if (!ROOTS.has(path.split('/')[0] ?? ''))
      throw new InvalidSnapshot('unsupported_entry', path)
    return 'directory'
  }
  if (isPlaceholder(path)) return 'ignore'
  if (classifyPath(path).kind !== 'text')
    throw new InvalidSnapshot('unsupported_path', path)
  if (size !== undefined && size > MAX_TEXT_BYTES)
    throw new InvalidSnapshot('text_too_large', path)
  return 'text'
}
