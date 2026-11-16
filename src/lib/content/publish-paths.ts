import { photoSlugSchema } from '@/lib/content/schemas'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const HOUSEKEEPING = new Set([
  'README.md',
  '.gitignore',
  '.gitattributes',
  '.github/workflows/publish.yml',
])

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

/** Maps an added, changed or deleted repository path to its cache dependencies. */
export function classifyPath(path: string): {
  kind: 'text' | 'ignore' | 'deploy'
  tags: string[]
} {
  if (!isContentPath(path)) return { kind: 'deploy', tags: [] }
  if (HOUSEKEEPING.has(path)) return { kind: 'ignore', tags: [] }
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
    photoSlugSchema.safeParse(name).success &&
    file?.endsWith('.md')
  ) {
    if (file === 'index.md') tags = [`album:${String(name)}`, 'albums']
    else if (photoSlugSchema.safeParse(file.slice(0, -3)).success)
      tags = [
        `photo:${String(name)}/${file.slice(0, -3)}`,
        `album:${String(name)}`,
        'albums',
      ]
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
