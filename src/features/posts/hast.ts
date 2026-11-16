import type { Element, Nodes } from 'hast'

/** Whether `node` is an element, optionally with the given tag name. */
export function isElement(
  node: Nodes | undefined,
  tagName?: string
): node is Element {
  return (
    node?.type === 'element' &&
    (tagName === undefined || node.tagName === tagName)
  )
}

/** The first child element with the given tag name. */
export function childElement(
  parent: Element,
  tagName: string
): Element | undefined {
  return parent.children.find((child): child is Element =>
    isElement(child, tagName)
  )
}

/** The concatenated text inside a node. */
export function textOf(node: Nodes): string {
  if (node.type === 'text') return node.value
  if ('children' in node) return node.children.map(textOf).join('')
  return ''
}

/** A string property such as `dataKind`, or undefined. */
export function stringProperty(
  node: Element,
  name: string
): string | undefined {
  const value = node.properties[name]
  return typeof value === 'string' ? value : undefined
}
