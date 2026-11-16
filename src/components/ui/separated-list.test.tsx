import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SeparatedList } from './separated-list'

describe('SeparatedList', () => {
  it('renders an empty list without separators', () => {
    const html = renderToStaticMarkup(<SeparatedList items={[]} />)
    expect(html).not.toContain('data-separated-item')
    expect(html).not.toContain('data-separator=')
  })

  it('keeps each item and its following dot in the same nowrap box', () => {
    const html = renderToStaticMarkup(
      <SeparatedList items={['Next.js', 'Tailwind CSS', 'TypeScript']} />
    )
    expect(html.match(/data-separated-item=""/g)).toHaveLength(3)
    expect(html.match(/whitespace-nowrap/g)).toHaveLength(3)
    expect(html.match(/data-separator=""/g)).toHaveLength(2)
    expect(html).toContain(
      '<span data-separated-value="">Tailwind CSS</span> <span aria-hidden="true" class="ml-2.5" data-separator="">·</span></span> '
    )
    expect(html).toContain(
      '<span data-separated-value="">TypeScript</span></span></span>'
    )
    expect(html.replace(/<[^>]*>/g, '')).toBe(
      'Next.js · Tailwind CSS · TypeScript'
    )
  })

  it('does not add a separator to a single item', () => {
    const html = renderToStaticMarkup(<SeparatedList items={['Only item']} />)
    expect(html).not.toContain('data-separator=')
  })

  it('preserves semantic markup and custom layout classes', () => {
    const html = renderToStaticMarkup(
      <SeparatedList
        className="contents"
        items={[
          <time key="date" dateTime="2026-11-12">
            2026-11-12
          </time>,
          '2 photos',
        ]}
      />
    )
    expect(html).toContain('<time dateTime="2026-11-12">2026-11-12</time>')
    expect(html).toContain('contents')
    expect(html).not.toContain('inline-flex flex-wrap')
  })

  it('attaches an optional trailing dot before external content', () => {
    const html = renderToStaticMarkup(
      <SeparatedList items={['2 min read']} trailingSeparator />
    )
    expect(html.match(/data-separator=""/g)).toHaveLength(1)
    expect(html).toContain('data-separator="">·</span></span></span>')
  })

  it('keeps role steps intact and arrows audible', () => {
    const html = renderToStaticMarkup(
      <SeparatedList
        separator="→"
        items={['Developer', 'Lead reviewer (Jul)']}
      />
    )
    expect(html).not.toContain('aria-hidden')
    expect(html).toContain('data-separator="">→</span></span> ')
    expect(html.replace(/<[^>]*>/g, '')).toBe('Developer → Lead reviewer (Jul)')
  })
})
