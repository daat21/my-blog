import type { Element, ElementContent, Nodes, Root } from 'hast'
import { describe, expect, it } from 'vitest'

import { ContentError } from '@/lib/content/content-error'
import {
  firstSentenceOf,
  readingMinutesOf,
  renderMarkdown,
} from '@/lib/content/markdown/render-markdown'
import type { MediaResolver, ResolvedMedia } from '@/lib/media/types'

const FILE = 'writing/demo/index.md'

function fakeMedia(path: string): ResolvedMedia {
  if (path.endsWith('.mp4')) {
    return {
      kind: 'video',
      width: 640,
      height: 400,
      sources: [{ type: 'video/mp4', src: `/_media/${path}` }],
    }
  }
  return {
    kind: 'image',
    width: 1200,
    height: 750,
    src: `/_media/${path}.960.webp`,
    sources: [
      {
        type: 'image/avif',
        srcSet: `/_media/${path}.640.avif 640w, /_media/${path}.960.avif 960w`,
      },
      {
        type: 'image/webp',
        srcSet: `/_media/${path}.640.webp 640w, /_media/${path}.960.webp 960w`,
      },
    ],
  }
}

const media: MediaResolver = {
  resolve(ref) {
    const path = ref.slice('media:'.length)
    if (path.startsWith('missing/')) {
      return Promise.reject(new Error(`No file at media/${path}`))
    }
    return Promise.resolve(fakeMedia(path))
  },
}

function render(markdown: string) {
  return renderMarkdown(markdown, { file: FILE, media })
}

async function renderBlocks(markdown: string): Promise<Element[]> {
  const { body } = await render(markdown)
  return body.children.filter(child => child.type === 'element')
}

function findAll(node: Nodes, test: (element: Element) => boolean): Element[] {
  const found: Element[] = []
  if (node.type === 'element' && test(node)) found.push(node)
  if ('children' in node) {
    for (const child of node.children) found.push(...findAll(child, test))
  }
  return found
}

function byTag(tree: Root, tagName: string): Element[] {
  return findAll(tree, element => element.tagName === tagName)
}

async function failure(markdown: string): Promise<string> {
  try {
    await render(markdown)
  } catch (error) {
    if (error instanceof ContentError) return error.message
    throw error
  }
  throw new Error('Expected rendering to fail')
}

function el(
  tagName: string,
  properties: Element['properties'],
  children: ElementContent[] = []
): Element {
  return { type: 'element', tagName, properties, children }
}

describe('renderMarkdown: images', () => {
  it('renders a media image with a caption as a figure with a picture', async () => {
    const [figure] = await renderBlocks(
      '![A diagram](media:2026/demo/diagram.png "How it fits together.")\n'
    )
    expect(figure).toEqual(
      el('figure', { dataKind: 'image' }, [
        el('picture', {}, [
          el('source', {
            type: 'image/avif',
            srcSet:
              '/_media/2026/demo/diagram.png.640.avif 640w, /_media/2026/demo/diagram.png.960.avif 960w',
          }),
          el('source', {
            type: 'image/webp',
            srcSet:
              '/_media/2026/demo/diagram.png.640.webp 640w, /_media/2026/demo/diagram.png.960.webp 960w',
          }),
          el('img', {
            src: '/_media/2026/demo/diagram.png.960.webp',
            alt: 'A diagram',
            width: 1200,
            height: 750,
            loading: 'lazy',
            decoding: 'async',
          }),
        ]),
        el('figcaption', {}, [
          { type: 'text', value: 'How it fits together.' },
        ]),
      ])
    )
  })

  it('leaves out the figcaption when there is no caption', async () => {
    const [figure] = await renderBlocks('![A diagram](media:diagram.png)\n')
    expect(
      figure?.children.map(child => child.type === 'element' && child.tagName)
    ).toEqual(['picture'])
  })

  it('renders images inside list items as figures too', async () => {
    const { body } = await render('- ![A diagram](media:diagram.png)\n')
    expect(byTag(body, 'li')[0]?.children).toContainEqual(
      expect.objectContaining({ tagName: 'figure' })
    )
  })

  it('fails, naming the file, when alt text is missing', async () => {
    expect(await failure('Intro.\n\n![](media:diagram.png)\n')).toBe(
      'writing/demo/index.md:3:1: Image media:diagram.png has no alt text; describe it in ![alt](…)'
    )
  })

  it('treats whitespace-only alt text as missing', async () => {
    expect(await failure('![  ](media:diagram.png)\n')).toMatch(
      /^writing\/demo\/index\.md:1:1: Image media:diagram\.png has no alt text/
    )
  })

  it.each([
    'https://example.com/a.png',
    '/images/a.png',
    'a.png',
    'media:../outside.png',
  ])('rejects the image URL %s', async url => {
    expect(await failure(`![Alt](${url})\n`)).toBe(
      `writing/demo/index.md:1:1: Image URL "${url}" is not allowed; reference media as media:<path below media/>`
    )
  })

  it('rejects an image inside a paragraph of text', async () => {
    expect(await failure('Look: ![Alt](media:a.png) here.\n')).toBe(
      'writing/demo/index.md:1:7: Image media:a.png must stand in a paragraph of its own, separated by blank lines'
    )
  })

  it('rejects reference-style images', async () => {
    expect(
      await failure('![Alt][diagram]\n\n[diagram]: media:a.png\n')
    ).toMatch(/^writing\/demo\/index\.md:1:1: Reference-style images/)
  })

  it('names the file when the media cannot be resolved', async () => {
    expect(await failure('![Alt](media:missing/a.png)\n')).toBe(
      'writing/demo/index.md:1:1: Cannot resolve media:missing/a.png: No file at media/missing/a.png'
    )
  })

  it('rejects a video used as an image', async () => {
    expect(await failure('![Alt](media:clip.mp4)\n')).toBe(
      'writing/demo/index.md:1:1: media:clip.mp4 is a video, expected an image'
    )
  })
})

describe('renderMarkdown: video directive', () => {
  it('renders a looping, muted video figure with a caption', async () => {
    const [figure] = await renderBlocks(
      '::video[The sidebar on a *narrow* screen.]{src="media:2026/demo/sidebar.mp4"}\n'
    )
    expect(figure).toEqual(
      el('figure', { dataKind: 'video' }, [
        el(
          'video',
          {
            autoPlay: true,
            muted: true,
            loop: true,
            playsInline: true,
            width: 640,
            height: 400,
          },
          [
            el('source', {
              src: '/_media/2026/demo/sidebar.mp4',
              type: 'video/mp4',
            }),
          ]
        ),
        el('figcaption', {}, [
          { type: 'text', value: 'The sidebar on a narrow screen.' },
        ]),
      ])
    )
  })

  it('requires a caption', async () => {
    expect(await failure('::video{src="media:clip.mp4"}\n')).toBe(
      'writing/demo/index.md:1:1: ::video needs a caption: ::video[Caption]{src="media:clip.mp4"}'
    )
  })

  it('requires a media: src', async () => {
    expect(
      await failure('::video[Caption]{src="https://example.com/a.mp4"}\n')
    ).toBe(
      'writing/demo/index.md:1:1: ::video needs src="media:<path below media/>"'
    )
  })

  it('rejects unknown attributes', async () => {
    expect(
      await failure('::video[Caption]{src="media:clip.mp4" controls}\n')
    ).toBe(
      'writing/demo/index.md:1:1: ::video does not take "controls"; only src is supported'
    )
  })

  it('rejects an image used as a video', async () => {
    expect(await failure('::video[Caption]{src="media:still.png"}\n')).toBe(
      'writing/demo/index.md:1:1: media:still.png is an image, expected a video'
    )
  })
})

describe('renderMarkdown: callouts', () => {
  it.each(['note', 'warning'])(
    'renders :::%s as an aside with its Markdown content',
    async kind => {
      const [aside] = await renderBlocks(
        `:::${kind}\nRead the [docs](https://example.com) first.\n:::\n`
      )
      expect(aside?.tagName).toBe('aside')
      expect(aside?.properties).toEqual({ dataCallout: kind })
      const [paragraph] = (aside?.children ?? []).filter(
        child => child.type === 'element'
      )
      expect(paragraph?.tagName).toBe('p')
      expect(
        findAll(aside ?? el('x', {}), e => e.tagName === 'a')[0]?.properties
      ).toEqual({
        href: 'https://example.com',
      })
    }
  )

  it('rejects a callout label', async () => {
    expect(await failure(':::note[Heads up]\nText.\n:::\n')).toBe(
      'writing/demo/index.md:1:1: :::note does not take a [label]'
    )
  })

  it('rejects callout attributes', async () => {
    expect(await failure(':::warning{.big}\nText.\n:::\n')).toBe(
      'writing/demo/index.md:1:1: :::warning does not take {attributes}'
    )
  })
})

describe('renderMarkdown: unknown directives', () => {
  it.each([
    [':::tip\nText.\n:::\n', ':::tip'],
    ['::youtube{id="abc"}\n', '::youtube'],
    [':::video\nText.\n:::\n', ':::video'],
    ['::note\n', '::note'],
  ])('rejects %j', async (markdown, name) => {
    expect(await failure(markdown)).toBe(
      `writing/demo/index.md:1:1: Unknown directive "${name}"; the supported directives are :::note, :::warning and ::video`
    )
  })

  it('rejects text directives and explains how to escape a colon', async () => {
    expect(await failure('Meet me at re:Invent.\n')).toBe(
      'writing/demo/index.md:1:14: Unknown directive ":Invent"; the supported directives are :::note, :::warning and ::video. To write a colon directly before a word, escape it as \\:'
    )
  })

  it('accepts an escaped colon', async () => {
    const { body } = await render('Meet me at re\\:Invent.\n')
    expect(byTag(body, 'p')[0]?.children).toEqual([
      { type: 'text', value: 'Meet me at re:Invent.' },
    ])
  })
})

describe('renderMarkdown: code blocks', () => {
  const titled =
    '```css title="styles/prose.css"\n.prose {\n  max-width: 65ch;\n}\n```\n'

  it('wraps a titled block in a figure with a caption', async () => {
    const [figure] = await renderBlocks(titled)
    expect(figure?.tagName).toBe('figure')
    expect(figure?.properties).toEqual({
      dataKind: 'code',
      dataTitle: 'styles/prose.css',
    })
    const [caption, pre] = figure?.children ?? []
    expect(caption).toEqual(
      el('figcaption', {}, [{ type: 'text', value: 'styles/prose.css' }])
    )
    expect(pre).toMatchObject({ type: 'element', tagName: 'pre' })
  })

  it('highlights with dual vitesse themes driven by CSS variables', async () => {
    const { body } = await render(titled)
    const [pre] = byTag(body, 'pre')
    expect(pre?.properties).toEqual({
      className: ['shiki', 'shiki-themes', 'vitesse-light', 'vitesse-dark'],
      style: expect.stringMatching(
        /^--shiki-light:\S+;--shiki-dark:\S+;--shiki-light-bg:\S+;--shiki-dark-bg:\S+$/
      ) as unknown,
      tabIndex: 0,
      dataLanguage: 'css',
    })
    const [code] = pre?.children ?? []
    expect(code).toMatchObject({ tagName: 'code', properties: {} })
    const lines = byTag(body, 'span').filter(
      ({ properties }) =>
        Array.isArray(properties.className) &&
        properties.className.includes('line')
    )
    expect(lines).toHaveLength(3)
    const tokens = byTag(body, 'span').filter(
      span => typeof span.properties.style === 'string'
    )
    expect(tokens.length).toBeGreaterThan(0)
    for (const token of tokens) {
      expect(token.properties.style).toMatch(
        /^--shiki-light:\S+;--shiki-dark:\S+$/
      )
    }
  })

  it('leaves untitled blocks as a bare pre', async () => {
    const [pre] = await renderBlocks('```ts\nconst a = 1\n```\n')
    expect(pre?.tagName).toBe('pre')
    expect(pre?.properties.dataLanguage).toBe('ts')
  })

  it('highlights blocks without a language as plain text', async () => {
    const [pre] = await renderBlocks('```\nplain words\n```\n')
    expect(pre?.tagName).toBe('pre')
    expect(pre?.properties.dataLanguage).toBe('text')
    expect(pre?.properties.className).toContain('shiki')
  })

  it('accepts single-quoted titles', async () => {
    const [figure] = await renderBlocks(
      "```sh title='Terminal'\npnpm dev\n```\n"
    )
    expect(figure?.properties.dataTitle).toBe('Terminal')
  })

  it('rejects an unknown language with its line', async () => {
    expect(await failure('Intro.\n\n```notalanguage\nx\n```\n')).toBe(
      'writing/demo/index.md:3:1: Unknown code block language "notalanguage"'
    )
  })

  it('rejects options other than title', async () => {
    expect(await failure('```ts {1,3}\nconst a = 1\n```\n')).toBe(
      'writing/demo/index.md:1:1: Unsupported code block options "{1,3}"; only title="…" is supported'
    )
  })

  it('leaves inline code alone', async () => {
    const { body } = await render('Use `pnpm dev` to start.\n')
    expect(byTag(body, 'code')[0]).toEqual(
      el('code', {}, [{ type: 'text', value: 'pnpm dev' }])
    )
  })
})

describe('renderMarkdown: headings', () => {
  it('collects h2 and h3 with the ids rehype-slug assigns', async () => {
    const { body, headings } = await render(
      [
        '# Title',
        '## Getting *started*',
        '### Install',
        '#### Too deep',
        '## Getting started',
        '### `code` & more',
        '',
        'Text with a note.[^1]',
        '',
        '[^1]: The footnote.',
        '',
      ].join('\n')
    )
    expect(headings).toEqual([
      { depth: 2, id: 'getting-started', text: 'Getting started' },
      { depth: 3, id: 'install', text: 'Install' },
      { depth: 2, id: 'getting-started-1', text: 'Getting started' },
      { depth: 3, id: 'code--more', text: 'code & more' },
    ])
    const ids = [...byTag(body, 'h2'), ...byTag(body, 'h3')].map(
      heading => heading.properties.id
    )
    for (const heading of headings) expect(ids).toContain(heading.id)
  })
})

describe('renderMarkdown: reading time', () => {
  it('rounds words / 200 up', async () => {
    const words = Array.from({ length: 401 }, () => 'word').join(' ')
    expect((await render(words)).readingMinutes).toBe(3)
    expect(readingMinutesOf(words)).toBe(3)
  })

  it('is at least one minute', async () => {
    expect((await render('Short.')).readingMinutes).toBe(1)
    expect(readingMinutesOf('')).toBe(1)
  })

  it('counts code but not punctuation or alt text', () => {
    const words = Array.from({ length: 150 }, () => 'word').join(' ')
    const code = Array.from({ length: 60 }, () => 'call();').join('\n')
    expect(readingMinutesOf(`${words}\n\n![${words}](media:a.png)\n`)).toBe(1)
    expect(readingMinutesOf(`${words}\n\n\`\`\`js\n${code}\n\`\`\`\n`)).toBe(2)
  })
})

describe('firstSentenceOf', () => {
  it('returns the first sentence of the first paragraph', () => {
    expect(firstSentenceOf('We left before dawn. The tide was out.')).toBe(
      'We left before dawn.'
    )
  })

  it('returns plain text, with lines joined', () => {
    expect(
      firstSentenceOf('A *very* quiet\n[harbour](https://example.com)? Yes.')
    ).toBe('A very quiet harbour?')
  })

  it('skips headings and paragraphs without text', () => {
    expect(
      firstSentenceOf(
        '## Before\n\n![A boat](media:a.png)\n\nThe light came last. Then wind.'
      )
    ).toBe('The light came last.')
  })

  it('is undefined without a paragraph of text', () => {
    expect(firstSentenceOf('')).toBeUndefined()
    expect(firstSentenceOf('## Only a heading')).toBeUndefined()
  })
})

describe('renderMarkdown: GFM and raw HTML', () => {
  it('supports tables, strikethrough, task lists and autolinks', async () => {
    const { body } = await render(
      [
        '| A | B |',
        '| - | - |',
        '| 1 | 2 |',
        '',
        '~~old~~ and https://example.com',
        '',
        '- [x] done',
        '',
      ].join('\n')
    )
    expect(byTag(body, 'table')).toHaveLength(1)
    expect(byTag(body, 'del')).toHaveLength(1)
    expect(byTag(body, 'a')[0]?.properties.href).toBe('https://example.com')
    expect(byTag(body, 'input')[0]?.properties).toMatchObject({
      type: 'checkbox',
      checked: true,
    })
  })

  it('drops raw HTML', async () => {
    const { body } = await render(
      '<script>alert(1)</script>\n\nSome <b>bold</b> text.\n\n<div>block</div>\n'
    )
    expect(byTag(body, 'script')).toEqual([])
    expect(byTag(body, 'b')).toEqual([])
    expect(byTag(body, 'div')).toEqual([])
    expect(JSON.stringify(body)).not.toContain('"raw"')
    expect(byTag(body, 'p')[0]?.children).toEqual([
      { type: 'text', value: 'Some ' },
      { type: 'text', value: 'bold' },
      { type: 'text', value: ' text.' },
    ])
  })
})

describe('renderMarkdown: output', () => {
  it('is plain, position-free data with no nested roots', async () => {
    const { body } = await render(
      '## Hi\n\n```ts title="a.ts"\nconst a = 1\n```\n\n```css\na {}\n```\n\n![Alt](media:a.png)\n'
    )
    const nodes: unknown[] = []
    const walk = (node: Nodes): void => {
      nodes.push(node)
      if ('children' in node) node.children.forEach(walk)
    }
    walk(body)
    for (const node of nodes) {
      expect(Object.getPrototypeOf(node)).toBe(Object.prototype)
      expect(node).not.toHaveProperty('position')
    }
    const types = nodes.map(node => (node as Nodes).type)
    expect(types.filter(type => type === 'root')).toHaveLength(1)
    expect([...new Set(types)].sort()).toEqual(['element', 'root', 'text'])
    expect(byTag(body, 'pre')).toHaveLength(2)
    expect(
      body.children.filter(child => child.type === 'element')
    ).toHaveLength(4)
    expect(JSON.parse(JSON.stringify(body))).toEqual(body)
  })
})
