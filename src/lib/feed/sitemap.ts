import { escapeXml } from '@/lib/feed/rss'

export interface SitemapEntry {
  url: string
  /** An ISO date (`YYYY-MM-DD`). */
  lastModified?: string
}

/** Renders entries as a sitemaps.org `urlset` document. */
export function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries.map(entry =>
    [
      '<url>',
      `<loc>${escapeXml(entry.url)}</loc>`,
      ...(entry.lastModified
        ? [`<lastmod>${escapeXml(entry.lastModified)}</lastmod>`]
        : []),
      '</url>',
    ].join('\n')
  )
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}
