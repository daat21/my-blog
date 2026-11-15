import type { Element, Root } from 'hast'
import { bundledLanguages, isSpecialLang } from 'shiki'
import type { Plugin } from 'unified'
import { SKIP, visit } from 'unist-util-visit'

import { ContentError, locate } from '@/lib/content/content-error'

import type { MarkdownContext } from './context'
import { element, text } from './hast'

const LANGUAGE_PREFIX = 'language-'
const TITLE = /^title=(?:"([^"]*)"|'([^']*)')$/

function languageOf(code: Element): string | undefined {
  const classes = code.properties.className
  if (!Array.isArray(classes)) return undefined
  for (const name of classes) {
    if (typeof name === 'string' && name.startsWith(LANGUAGE_PREFIX)) {
      return name.slice(LANGUAGE_PREFIX.length)
    }
  }
  return undefined
}

function titleOf(
  meta: string | null | undefined,
  where: string
): string | undefined {
  const options = meta?.trim()
  if (!options) return undefined
  const match = TITLE.exec(options)
  const title = (match?.[1] ?? match?.[2])?.trim()
  if (!title) {
    throw new ContentError(
      `${where}: Unsupported code block options "${options}"; only title="…" is supported`
    )
  }
  return title
}

/**
 * Checks code block languages and handles the `title` option.
 *
 * A titled block, written as ```css title="styles/prose.css", is wrapped as
 * `<figure data-kind="code" data-title="styles/prose.css">` holding a
 * `<figcaption>` with the title and then the `<pre>`. The figure keeps the
 * title as real text for assistive technology and the plain HTML rendering,
 * while `data-title` saves the UI from digging it out of the caption.
 *
 * Runs before Shiki, which then highlights the `<pre>` inside the figure.
 * Languages are checked here so an unknown one fails with a line number.
 */
export const rehypeCodeBlocks: Plugin<[MarkdownContext], Root> =
  context => tree => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === undefined) return
      const code = node.children[0]
      if (code?.type !== 'element' || code.tagName !== 'code') return SKIP

      const where = locate(context.file, node)
      const language = languageOf(code)
      if (
        language !== undefined &&
        !Object.hasOwn(bundledLanguages, language) &&
        !isSpecialLang(language)
      ) {
        throw new ContentError(
          `${where}: Unknown code block language "${language}"`
        )
      }

      const title = titleOf(code.data?.meta, where)
      if (title !== undefined) {
        parent.children[index] = element(
          'figure',
          { dataKind: 'code', dataTitle: title },
          [element('figcaption', {}, [text(title)]), node]
        )
      }
      return SKIP
    })
  }
