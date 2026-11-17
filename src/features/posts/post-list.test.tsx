import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { PostSummary } from '@/lib/content'

import { PostList } from './post-list'

const post: PostSummary = {
  slug: 'example',
  title: 'Example',
  description: 'Example description.',
  date: '2026-11-10',
  tags: [],
  draft: false,
  readingMinutes: 1,
  cover: {
    alt: 'A layout sketch',
    image: {
      kind: 'image',
      width: 1200,
      height: 750,
      src: '/_media/sketch.960.webp',
      sources: [
        {
          type: 'image/avif',
          srcSet: '/_media/sketch.640.avif 640w, /_media/sketch.960.avif 960w',
        },
        {
          type: 'image/webp',
          srcSet: '/_media/sketch.640.webp 640w, /_media/sketch.960.webp 960w',
        },
      ],
    },
  },
}

describe('post list covers', () => {
  it('uses responsive variants, explicit dimensions and lazy loading after the first rows', () => {
    const html = renderToStaticMarkup(
      <PostList
        posts={[post, { ...post, slug: 'second' }, { ...post, slug: 'third' }]}
      />
    )
    expect(html.match(/loading="eager"/g)).toHaveLength(2)
    expect(html.match(/loading="lazy"/g)).toHaveLength(1)
    expect(html).toContain('alt="A layout sketch"')
    expect(html).toContain('width="1200" height="750"')
    expect(html).toContain('sizes="(min-width: 768px) 112px, 80px"')
    expect(html).toContain('type="image/avif"')
    expect(html).toContain('type="image/webp"')
    expect(html).toContain('aspect-4/3')
    expect(html).toContain('object-cover')
  })

  it('renders no picture or placeholder for a post without an image', () => {
    const plain = { ...post }
    delete plain.cover
    const html = renderToStaticMarkup(<PostList posts={[plain]} />)
    expect(html).not.toContain('<picture')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('aspect-4/3')
  })
})
