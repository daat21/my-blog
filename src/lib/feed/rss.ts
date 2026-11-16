export interface RssChannel {
  title: string
  /** Absolute URL of the site. */
  link: string
  description: string
  /** Absolute URL of the feed itself. */
  feedUrl: string
  /** BCP 47 language tag, e.g. `en`. */
  language: string
  /** ISO date, `YYYY-MM-DD`, of the latest change to any item. */
  lastBuildDate?: string
}

export interface RssItem {
  title: string
  /** Absolute URL of the item; also used as its permanent guid. */
  link: string
  /** Plain-text summary. */
  description: string
  /** ISO date, `YYYY-MM-DD`. */
  date: string
  categories: string[]
}

// Everything outside XML 1.0's Char production, e.g. control characters and
// lone surrogates. Such characters make the whole document invalid.
const INVALID_XML_CHARS = /[^\t\n\r -퟿-�\u{10000}-\u{10FFFF}]/gu

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

/** Escapes text for XML and drops the characters that XML forbids. */
export function escapeXml(text: string): string {
  return text
    .replace(INVALID_XML_CHARS, '')
    .replace(/[&<>"']/g, char => ENTITIES[char] ?? char)
}

/** Formats an ISO date (`YYYY-MM-DD`) as the RFC 822 date RSS expects. */
export function toRfc822(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString()
}

const element = (name: string, text: string) =>
  `<${name}>${escapeXml(text)}</${name}>`

function renderItem(item: RssItem): string {
  return [
    '<item>',
    element('title', item.title),
    element('link', item.link),
    `<guid isPermaLink="true">${escapeXml(item.link)}</guid>`,
    element('pubDate', toRfc822(item.date)),
    element('description', item.description),
    ...item.categories.map(category => element('category', category)),
    '</item>',
  ].join('\n')
}

/** Renders an RSS 2.0 document with one summary item per entry. */
export function renderRss(channel: RssChannel, items: RssItem[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    element('title', channel.title),
    element('link', channel.link),
    element('description', channel.description),
    element('language', channel.language),
    ...(channel.lastBuildDate
      ? [element('lastBuildDate', toRfc822(channel.lastBuildDate))]
      : []),
    `<atom:link href="${escapeXml(channel.feedUrl)}" rel="self" type="application/rss+xml"/>`,
    ...items.map(renderItem),
    '</channel>',
    '</rss>',
    '',
  ].join('\n')
}
