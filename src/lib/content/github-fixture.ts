import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

import type { TextSnapshot } from './snapshot'

/** Loads only the fictional example text for adapter tests and local rehearsals. */
export async function exampleSnapshot(): Promise<TextSnapshot> {
  const files: Record<string, string> = {}
  async function walk(folder: string): Promise<void> {
    for (const entry of await readdir(path.join('content-example', folder), {
      withFileTypes: true,
    })) {
      const file = `${folder}/${entry.name}`
      if (entry.isDirectory()) await walk(file)
      else
        files[file] = await readFile(path.join('content-example', file), 'utf8')
    }
  }
  files['profile.yaml'] = await readFile('content-example/profile.yaml', 'utf8')
  for (const folder of ['writing', 'photos', 'projects']) await walk(folder)
  return {
    version: 1,
    revision: 'a'.repeat(40),
    mediaTree: 'b'.repeat(40),
    files,
  }
}

/** Constructs immutable Git API fixtures without ever exposing media blobs. */
export function fixtureApi(snapshot: TextSnapshot) {
  const responses = new Map<string, unknown>()
  const hash = (text: string) => createHash('sha1').update(text).digest('hex')
  const blobs = Object.entries(snapshot.files).map(([file, text]) => {
    const sha = hash(text)
    responses.set(`git/blobs/${sha}`, {
      sha,
      encoding: 'base64',
      size: Buffer.byteLength(text),
      content: Buffer.from(text).toString('base64'),
    })
    return {
      path: file,
      mode: '100644',
      type: 'blob',
      sha,
      size: Buffer.byteLength(text),
    }
  })
  const directories = new Set(
    blobs.flatMap(blob =>
      blob.path
        .split('/')
        .slice(0, -1)
        .map((_, i) =>
          blob.path
            .split('/')
            .slice(0, i + 1)
            .join('/')
        )
    )
  )
  const trees = [...directories].map(dir => ({
    path: dir,
    mode: '040000',
    type: 'tree',
    sha: hash(`tree:${snapshot.revision}:${dir}`),
  }))
  const rootSha = hash(`root:${snapshot.revision}`)
  const all = [...trees, ...blobs]
  const root = all.filter(item => !item.path.includes('/'))
  if (snapshot.mediaTree)
    root.push({
      path: 'media',
      mode: '040000',
      type: 'tree',
      sha: snapshot.mediaTree,
    })
  responses.set(`commits/main`, {
    sha: snapshot.revision,
    commit: { tree: { sha: rootSha } },
  })
  responses.set(`git/trees/${rootSha}`, {
    sha: rootSha,
    truncated: false,
    tree: root,
  })
  for (const tree of trees) {
    const descendants = all
      .filter(item => item.path.startsWith(`${tree.path}/`))
      .map(item => ({ ...item, path: item.path.slice(tree.path.length + 1) }))
    responses.set(`git/trees/${tree.sha}?recursive=1`, {
      sha: tree.sha,
      truncated: false,
      tree: descendants,
    })
    responses.set(`git/trees/${tree.sha}`, {
      sha: tree.sha,
      truncated: false,
      tree: descendants.filter(item => !item.path.includes('/')),
    })
  }
  return responses
}
