import type { Element, ElementContent, Root } from 'hast'
import { describe, expect, it } from 'vitest'

import { numberFigures } from './figure-numbers'

function figure(kind: string, captioned: boolean): Element {
  const children: ElementContent[] = [
    { type: 'element', tagName: 'picture', properties: {}, children: [] },
  ]
  if (captioned) {
    children.push({
      type: 'element',
      tagName: 'figcaption',
      properties: {},
      children: [{ type: 'text', value: 'Caption' }],
    })
  }
  return {
    type: 'element',
    tagName: 'figure',
    properties: { dataKind: kind },
    children,
  }
}

describe('numberFigures', () => {
  it('numbers captioned image and video figures in reading order', () => {
    const image = figure('image', true)
    const uncaptioned = figure('image', false)
    const code = figure('code', true)
    const video = figure('video', true)
    const nested = figure('image', true)
    const root: Root = {
      type: 'root',
      children: [
        image,
        uncaptioned,
        code,
        video,
        {
          type: 'element',
          tagName: 'aside',
          properties: {},
          children: [nested],
        },
      ],
    }

    const numbers = numberFigures(root)
    expect(numbers.get(image)).toBe(1)
    expect(numbers.get(video)).toBe(2)
    expect(numbers.get(nested)).toBe(3)
    expect(numbers.has(uncaptioned)).toBe(false)
    expect(numbers.has(code)).toBe(false)
  })
})
