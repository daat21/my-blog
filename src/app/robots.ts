import type { MetadataRoute } from 'next'

import { env } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  // Preview and development deployments share content with production (and
  // may show drafts), so they must never be indexed.
  if (!env.isProduction) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  }
}
