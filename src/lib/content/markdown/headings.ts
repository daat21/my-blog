import type { Root } from 'hast'
import { SKIP, visit } from 'unist-util-visit'

import type { Heading } from '@/lib/content/types'

import { textContent } from './hast'

/**
 * Collects `h2` and `h3` for the table of contents. Runs on the rendered
 * tree, so each `id` is exactly the one rehype-slug gave the element.
 */
export function collectHeadings(tree: Root): Heading[] {
  const headings: Heading[] = []
  visit(tree, 'element', node => {
    // The GFM footnote section brings its own visually hidden heading.
    if (node.tagName === 'section' && node.properties.dataFootnotes) {
      return SKIP
    }
    if (node.tagName !== 'h2' && node.tagName !== 'h3') return
    const { id } = node.properties
    if (typeof id === 'string') {
      headings.push({
        depth: node.tagName === 'h2' ? 2 : 3,
        id,
        text: textContent(node).trim(),
      })
    }
    return SKIP
  })
  return headings
}
