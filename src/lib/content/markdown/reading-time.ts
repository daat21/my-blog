import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

const WORDS_PER_MINUTE = 200
const WORD = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu

/**
 * Estimates reading time as words / 200, rounded up, at least one minute.
 * Prose, inline code and code blocks all count; alt text does not.
 */
export function countReadingMinutes(tree: Root): number {
  let words = 0
  visit(tree, node => {
    if (
      node.type === 'text' ||
      node.type === 'inlineCode' ||
      node.type === 'code'
    ) {
      words += node.value.match(WORD)?.length ?? 0
    }
  })
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}
