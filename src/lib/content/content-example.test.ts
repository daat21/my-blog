import { stat } from 'node:fs/promises'
import path from 'node:path'

import type { Element, Nodes } from 'hast'
import { describe, expect, it } from 'vitest'

import { createFileSystemSource } from '@/lib/content/file-system-source'
import type { MediaResolver } from '@/lib/media/types'

const contentDir = path.resolve('content-example')

/** Resolves only files that exist, so a broken reference fails the test. */
const media: MediaResolver = {
  async resolve(ref) {
    const file = ref.slice('media:'.length)
    await stat(path.join(contentDir, 'media', file))
    if (file.endsWith('.mp4')) {
      return {
        kind: 'video',
        width: 640,
        height: 400,
        sources: [{ type: 'video/mp4', src: `/_media/${file}` }],
      }
    }
    return {
      kind: 'image',
      width: 1200,
      height: 750,
      src: `/_media/${file}`,
      sources: [{ type: 'image/webp', srcSet: `/_media/${file} 1200w` }],
    }
  },
}

const published = createFileSystemSource({
  contentDir,
  showDrafts: false,
  media,
})
const withDrafts = createFileSystemSource({
  contentDir,
  showDrafts: true,
  media,
})

function elements(node: Nodes): Element[] {
  const found: Element[] = node.type === 'element' ? [node] : []
  if ('children' in node) found.push(...node.children.flatMap(elements))
  return found
}

describe('content-example', () => {
  it('lists the published posts newest first, without the draft', async () => {
    const posts = await published.listPosts()
    expect(posts.map(post => post.slug)).toEqual([
      'a-tour-of-the-content-format',
      'designing-for-slow-networks',
      'keeping-a-work-log',
    ])
  })

  it('has one draft, shown only with drafts on', async () => {
    const drafts = (await withDrafts.listPosts()).filter(post => post.draft)
    expect(drafts.map(post => post.slug)).toEqual([
      'unfinished-thoughts-on-testing',
    ])
  })

  it('renders every post', async () => {
    for (const summary of await withDrafts.listPosts()) {
      const post = await withDrafts.getPost(summary.slug)
      expect(post?.body.children.length).toBeGreaterThan(0)
    }
  })

  it('has a post that exercises every Markdown feature', async () => {
    const post = await published.getPost('a-tour-of-the-content-format')
    if (!post) throw new Error('Feature tour not found')
    const all = elements(post.body)
    const tags = new Set(all.map(element => element.tagName))
    for (const tag of [
      'h2',
      'h3',
      'ul',
      'ol',
      'table',
      'blockquote',
      'code',
      'pre',
      'a',
    ]) {
      expect(tags, tag).toContain(tag)
    }
    const kinds = all.map(element => element.properties.dataKind)
    expect(kinds).toEqual(expect.arrayContaining(['image', 'video', 'code']))
    const callouts = all.map(element => element.properties.dataCallout)
    expect(callouts).toEqual(expect.arrayContaining(['note', 'warning']))
    const imageFigure = all.find(e => e.properties.dataKind === 'image')
    expect(imageFigure && elements(imageFigure).map(e => e.tagName)).toContain(
      'figcaption'
    )
    expect(post.headings.length).toBeGreaterThan(4)
  })

  it('aggregates tags from the published posts', async () => {
    expect(await published.listTags()).toEqual([
      { tag: 'design', count: 2 },
      { tag: 'writing', count: 2 },
      { tag: 'habits', count: 1 },
      { tag: 'markdown', count: 1 },
      { tag: 'performance', count: 1 },
    ])
  })

  it('lists four projects, the featured one with an image first', async () => {
    const projects = await published.listProjects()
    expect(projects.map(project => project.slug)).toEqual([
      'weather-glance',
      'trail-journal',
      'palette-picker',
      'markdown-lint-action',
    ])
    expect(projects[0]).toMatchObject({
      featured: true,
      image: { kind: 'image' },
    })
  })

  it('has a valid, fictional profile', async () => {
    const profile = await published.getProfile()
    expect(profile.name).toBe('Avery Example')
    expect(profile.location).toBe('Exampleton')
  })
})
