import { describe, expect, it } from 'vitest'

import { renderSitemap } from '@/lib/feed/sitemap'

describe('renderSitemap', () => {
  it('lists each URL with its last modification date when known', () => {
    expect(
      renderSitemap([
        { url: 'https://example.com/' },
        { url: 'https://example.com/writing/a', lastModified: '2026-11-10' },
      ])
    ).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '<url>',
        '<loc>https://example.com/</loc>',
        '</url>',
        '<url>',
        '<loc>https://example.com/writing/a</loc>',
        '<lastmod>2026-11-10</lastmod>',
        '</url>',
        '</urlset>',
        '',
      ].join('\n')
    )
  })

  it('escapes URLs for XML', () => {
    expect(renderSitemap([{ url: 'https://example.com/?a=1&b=2' }])).toContain(
      '<loc>https://example.com/?a=1&amp;b=2</loc>'
    )
  })

  it('renders an empty urlset when there are no entries', () => {
    expect(renderSitemap([])).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>'
    )
  })
})
