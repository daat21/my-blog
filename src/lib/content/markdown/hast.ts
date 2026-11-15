import type { Element, ElementContent, Nodes, Properties, Text } from 'hast'

/** Builds a hast element. */
export function element(
  tagName: string,
  properties: Properties = {},
  children: ElementContent[] = []
): Element {
  return { type: 'element', tagName, properties, children }
}

/** Builds a hast text node. */
export function text(value: string): Text {
  return { type: 'text', value }
}

/** Concatenates the text inside a hast node. */
export function textContent(node: Nodes): string {
  if (node.type === 'text') return node.value
  if ('children' in node) return node.children.map(textContent).join('')
  return ''
}
