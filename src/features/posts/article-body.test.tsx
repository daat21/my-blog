import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { renderMarkdown } from '@/lib/content/markdown/render-markdown'
import type { MediaResolver } from '@/lib/media/types'

import { ArticleBody } from './article-body'

const media: MediaResolver = {
  resolve(ref) {
    const path = ref.slice('media:'.length)
    return Promise.resolve(
      path.endsWith('.mp4')
        ? {
            kind: 'video',
            width: 640,
            height: 400,
            sources: [{ type: 'video/mp4', src: `/_media/${path}` }],
          }
        : {
            kind: 'image',
            width: 1200,
            height: 750,
            src: `/_media/${path}.960.webp`,
            sources: [
              { type: 'image/avif', srcSet: `/_media/${path}.640.avif 640w` },
              { type: 'image/webp', srcSet: `/_media/${path}.640.webp 640w` },
            ],
          }
    )
  },
}

const SIZES = 'sizes="(min-width: 768px) 690px, 100vw"'

/** Renders Markdown through the content pipeline, then the article body. */
async function renderArticle(markdown: string): Promise<string> {
  const { body } = await renderMarkdown(markdown, {
    file: 'writing/test/index.md',
    media,
  })
  return renderToStaticMarkup(<ArticleBody body={body} />)
}

/** The text of every `<tag>` element, without markup. */
function texts(html: string, tag: string): string[] {
  const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'g')
  return [...html.matchAll(pattern)].map(([, inner = '']) =>
    inner.replace(/<[^>]*>/g, '')
  )
}

/** Every opening `<tag …>`. */
function openingTags(html: string, tag: string): string[] {
  return html.match(new RegExp(`<${tag}\\b[^>]*>`, 'g')) ?? []
}

describe('ArticleBody', () => {
  it('gives h2 headings a hidden ## marker and keeps heading ids', async () => {
    const html = await renderArticle('## Three rules\n\n### Detail')
    expect(html).toMatch(
      /<h2 id="three-rules"[^>]*><span aria-hidden="true"[^>]*>##<\/span>/
    )
    expect(html).toMatch(/<h3 id="detail"/)
  })

  it('marks external links noopener noreferrer, and only those', async () => {
    const html = await renderArticle(
      '[out](https://example.com) and [in](/notes/x) and [here](#top)'
    )
    const links = openingTags(html, 'a')
    expect(links).toHaveLength(3)
    expect(links[0]).toContain('rel="noopener noreferrer"')
    expect(links[1]).not.toContain('rel=')
    expect(links[2]).not.toContain('rel=')
  })

  it('numbers ordered list items with zero-padded, hidden numbers', async () => {
    const html = await renderArticle('3. Three\n4. Four')
    expect(openingTags(html, 'ol')[0]).toContain('start="3"')
    expect(html).toMatch(/<span aria-hidden="true"[^>]*>03<\/span>/)
    expect(html).toMatch(/<span aria-hidden="true"[^>]*>04<\/span>/)
    expect(texts(html, 'li')).toEqual(['03Three', '04Four'])
  })

  it('renders a titled code block with its title, highlighting and a copy button', async () => {
    const html = await renderArticle(
      '```css title="styles/prose.css"\n.prose {\n  max-width: 65ch;\n}\n```'
    )
    expect(texts(html, 'figcaption')).toEqual(['styles/prose.css'])
    const pre = openingTags(html, 'pre')[0]
    expect(pre).toContain('shiki')
    expect(pre).toContain('--shiki-light')
    expect(pre).toContain('tabindex="0"')
    expect(html.match(/class="line"/g)).toHaveLength(3)
    // Code inside a block is not styled as inline code.
    expect(openingTags(html, 'code')).toEqual(['<code>'])
    expect(html).toContain('aria-label="Copy code"')
  })

  it('renders an untitled code block without a header', async () => {
    const html = await renderArticle('```ts\nconst a = 1\n```')
    expect(html).not.toContain('<figcaption')
    expect(html).toContain('<pre')
    expect(html).toContain('aria-label="Copy code"')
  })

  it('styles inline code', async () => {
    const html = await renderArticle('Run `pnpm dev`.')
    expect(openingTags(html, 'code')[0]).toContain('font-mono')
  })

  it('numbers captioned image and video figures and sizes images', async () => {
    const html = await renderArticle(
      [
        '![A sketch](media:a.png "The sketch.")',
        '![No caption](media:b.png)',
        '::video[A clip.]{src="media:c.mp4"}',
      ].join('\n\n')
    )
    expect(texts(html, 'figcaption')).toEqual([
      'Fig. 1 — The sketch.',
      'Fig. 2 — A clip.',
    ])

    const images = openingTags(html, 'img')
    expect(images).toHaveLength(2)
    expect(images[0]).toContain('alt="A sketch"')
    expect(images.every(img => img.includes(SIZES))).toBe(true)
    const pictureSources = openingTags(html, 'source').filter(source =>
      /srcset=/i.test(source)
    )
    expect(pictureSources).toHaveLength(4)
    expect(pictureSources.every(source => source.includes(SIZES))).toBe(true)

    const video = openingTags(html, 'video')[0]
    expect(video).toContain('width="640"')
    expect(video).toContain('loop')
    // It only starts on its own once JavaScript runs, so it has controls.
    expect(video).toContain('controls')
    expect(html).toContain('<source src="/_media/c.mp4" type="video/mp4"/>')
  })

  it('spells out task states for screen readers', async () => {
    const html = await renderArticle('- [x] Ship it\n- [ ] Write it up')
    const boxes = openingTags(html, 'input')
    expect(boxes).toHaveLength(2)
    expect(boxes.every(box => box.includes('aria-hidden="true"'))).toBe(true)
    expect(texts(html, 'li')).toEqual(['Done:  Ship it', 'To do:  Write it up'])
  })

  it('turns note and warning blocks into labelled callouts', async () => {
    const html = await renderArticle(
      ':::note\nA **note**.\n:::\n\n:::warning\nCareful.\n:::'
    )
    expect(texts(html, 'aside')).toEqual(['Note.A note.', 'Warning.Careful.'])
    expect(openingTags(html, 'aside')[0]).toContain('role="note"')
  })
})
