import type { Element, Root } from 'hast'

import { childElement, isElement, stringProperty } from './hast'

const NUMBERED_KINDS = new Set(['image', 'video'])

/**
 * Numbers the captioned image and video figures of a post in reading
 * order, for the `Fig. 1` labels. Code figures and figures without a
 * caption are not numbered.
 */
export function numberFigures(root: Root): Map<Element, number> {
  const numbers = new Map<Element, number>()

  function visit(node: Root | Element) {
    for (const child of node.children) {
      if (!isElement(child)) continue
      if (
        child.tagName === 'figure' &&
        NUMBERED_KINDS.has(stringProperty(child, 'dataKind') ?? '') &&
        childElement(child, 'figcaption')
      ) {
        numbers.set(child, numbers.size + 1)
        continue
      }
      visit(child)
    }
  }

  visit(root)
  return numbers
}
