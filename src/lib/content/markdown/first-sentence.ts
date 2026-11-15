import type { Root } from 'mdast'
import { toString } from 'mdast-util-to-string'

const sentences = new Intl.Segmenter('en', { granularity: 'sentence' })

/**
 * The first sentence of the first paragraph that has text, as plain text,
 * or undefined when there is none. Alt text does not count as text.
 */
export function firstSentence(tree: Root): string | undefined {
  for (const node of tree.children) {
    if (node.type !== 'paragraph') continue
    const text = toString(node, { includeImageAlt: false })
      .replace(/\s+/g, ' ')
      .trim()
    if (text === '') continue
    const [first] = sentences.segment(text)
    return first?.segment.trim()
  }
  return undefined
}
