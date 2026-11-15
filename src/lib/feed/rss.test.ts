import { describe, expect, it } from 'vitest'

import {
  escapeXml,
  renderRss,
  toRfc822,
  type RssChannel,
  type RssItem,
} from '@/lib/feed/rss'

const channel: RssChannel = {
  title: 'Avery & Co',
  link: 'https://example.com',
  description: 'Thoughts on <the> web.',
  feedUrl: 'https://example.com/rss.xml',
  language: 'en',
}

const item: RssItem = {
  title: 'Tips & "tricks" for <dialog>',
  link: 'https://example.com/writing/tips?a=1&b=2',
  description: "It's short.",
  date: '2026-11-10',
  categories: ['css', 'html'],
}

describe('escapeXml', () => {
  it('escapes the five XML special characters', () => {
    expect(escapeXml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;'
    )
  })

  it('treats existing entities as plain text', () => {
    expect(escapeXml('&amp;')).toBe('&amp;amp;')
  })

  it('drops characters XML 1.0 does not allow', () => {
    expect(escapeXml('a\u0000b\u0008c\u001Fd￾e\uD800f')).toBe('abcdef')
  })

  it('keeps whitespace, non-ASCII text and astral characters', () => {
    expect(escapeXml('tab\there\nCafé — 😀')).toBe('tab\there\nCafé — 😀')
  })
})

describe('toRfc822', () => {
  it('formats an ISO date as midnight UTC', () => {
    expect(toRfc822('2026-11-10')).toBe('Tue, 10 Nov 2026 00:00:00 GMT')
  })
})

describe('renderRss', () => {
  const xml = renderRss(channel, [item])

  it('starts with the XML declaration and an RSS 2.0 root', () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(
      true
    )
    expect(xml).toContain('<rss version="2.0"')
    expect(xml.trimEnd().endsWith('</rss>')).toBe(true)
  })

  it('escapes channel fields and links to itself', () => {
    expect(xml).toContain('<title>Avery &amp; Co</title>')
    expect(xml).toContain(
      '<description>Thoughts on &lt;the&gt; web.</description>'
    )
    expect(xml).toContain('<language>en</language>')
    expect(xml).toContain(
      '<atom:link href="https://example.com/rss.xml" rel="self" type="application/rss+xml"/>'
    )
  })

  it('renders one escaped item with a permalink guid and its categories', () => {
    const link = 'https://example.com/writing/tips?a=1&amp;b=2'
    expect(xml).toContain(
      [
        '<item>',
        '<title>Tips &amp; &quot;tricks&quot; for &lt;dialog&gt;</title>',
        `<link>${link}</link>`,
        `<guid isPermaLink="true">${link}</guid>`,
        '<pubDate>Tue, 10 Nov 2026 00:00:00 GMT</pubDate>',
        '<description>It&apos;s short.</description>',
        '<category>css</category>',
        '<category>html</category>',
        '</item>',
      ].join('\n')
    )
  })

  it('adds lastBuildDate only when given', () => {
    expect(xml).not.toContain('<lastBuildDate>')
    expect(
      renderRss({ ...channel, lastBuildDate: '2026-11-12' }, [])
    ).toContain('<lastBuildDate>Thu, 12 Nov 2026 00:00:00 GMT</lastBuildDate>')
  })

  it('renders an empty channel without items', () => {
    expect(renderRss(channel, [])).not.toContain('<item>')
  })
})
