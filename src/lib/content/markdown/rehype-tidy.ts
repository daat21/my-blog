import type { ElementContent, Properties, Root, RootContent } from 'hast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

function isElementContent(node: RootContent): node is ElementContent {
  return node.type !== 'doctype'
}

/** Shiki writes attribute names; hast and its React renderer expect properties. */
function normalizeProperties(properties: Properties): void {
  if (typeof properties.class === 'string') {
    properties.className = properties.class.split(/\s+/).filter(Boolean)
    delete properties.class
  }
  if (properties.tabindex !== undefined) {
    properties.tabIndex = Number(properties.tabindex)
    delete properties.tabindex
  }
}

/**
 * Leaves a clean, plain-data tree for the posts feature and the cache:
 *
 * - @shikijs/rehype puts the root of each highlighted fragment where the
 *   `<pre>` was; those nested roots are unwrapped.
 * - Shiki's `class` and `tabindex` become `className` and `tabIndex`.
 * - Source positions are dropped, since errors have been reported by now and
 *   they would only make every cached post bigger.
 */
export const rehypeTidy: Plugin<[], Root> = () => tree => {
  visit(tree, (node, index, parent) => {
    if (node.type === 'root' && parent && index !== undefined) {
      if (parent.type === 'root') {
        parent.children.splice(index, 1, ...node.children)
      } else {
        parent.children.splice(
          index,
          1,
          ...node.children.filter(isElementContent)
        )
      }
      return index
    }
    delete node.position
    if (node.type === 'element') normalizeProperties(node.properties)
    return
  })
}
