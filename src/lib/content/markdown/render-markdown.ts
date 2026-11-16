import rehypeShiki, { type RehypeShikiOptions } from '@shikijs/rehype'
import type { Root as HastRoot } from 'hast'
import type { Root as MdastRoot } from 'mdast'
import rehypeSlug from 'rehype-slug'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

import { ContentError, messageOf } from '@/lib/content/content-error'
import type { Heading } from '@/lib/content/types'

import type { MarkdownContext } from './context'
import { firstSentence } from './first-sentence'
import { collectHeadings } from './headings'
import { countReadingMinutes } from './reading-time'
import { rehypeCodeBlocks } from './rehype-code-blocks'
import { rehypeTidy } from './rehype-tidy'
import { remarkDirectives } from './remark-directives'
import { remarkImages } from './remark-images'

export type { MarkdownContext } from './context'

export interface RenderedMarkdown {
  body: HastRoot
  headings: Heading[]
  readingMinutes: number
}

const SHIKI_OPTIONS: RehypeShikiOptions = {
  themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
  // No inline colours: every token gets --shiki-light and --shiki-dark custom
  // properties, and the stylesheet picks one per theme.
  defaultColor: false,
  // Load grammars on first use instead of every bundled language up front.
  langs: [],
  lazy: true,
  // Unlabelled blocks still get the themed <pre>, as plain text.
  defaultLanguage: 'text',
  transformers: [
    {
      name: 'data-language',
      pre(node) {
        node.properties.dataLanguage = this.options.lang
      },
    },
  ],
}

/** CommonMark + GFM + directives syntax; shared by listing and rendering. */
const markdown = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDirective)
  .freeze()

/** Estimates the reading time of a Markdown body without rendering it. */
export function readingMinutesOf(source: string): number {
  return countReadingMinutes(markdown.parse(source))
}

/** The first sentence of a Markdown body, as plain text, if it has one. */
export function firstSentenceOf(source: string): string | undefined {
  return firstSentence(markdown.parse(source))
}

/**
 * Renders a Markdown body to a hast tree, with its headings and reading
 * time. Errors name the file, and the line when it is known.
 */
export async function renderMarkdown(
  source: string,
  context: MarkdownContext
): Promise<RenderedMarkdown> {
  const processor = markdown()
    .use(remarkImages, context)
    .use(remarkDirectives, context)
    // Without allowDangerousHtml, raw HTML in content is dropped.
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeCodeBlocks, context)
    .use(rehypeShiki, SHIKI_OPTIONS)
    .use(rehypeTidy)

  const tree: MdastRoot = processor.parse(source)
  const readingMinutes = countReadingMinutes(tree)
  let body: HastRoot
  try {
    body = await processor.run(tree)
  } catch (error) {
    if (error instanceof ContentError) throw error
    throw new ContentError(`${context.file}: ${messageOf(error)}`, {
      cause: error,
    })
  }
  return { body, headings: collectHeadings(body), readingMinutes }
}
