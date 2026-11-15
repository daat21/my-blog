import path from 'node:path'

import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
  /** Directory holding the content; defaults to the bundled examples. */
  CONTENT_DIR: z.string().min(1).default('content-example'),
  /** Overrides the detected public URL of the site. */
  SITE_URL: z.url().optional(),
})

const parsed = schema.parse(process.env)

function detectSiteUrl(): string {
  if (parsed.SITE_URL) return parsed.SITE_URL
  if (
    parsed.VERCEL_ENV === 'production' &&
    parsed.VERCEL_PROJECT_PRODUCTION_URL
  )
    return `https://${parsed.VERCEL_PROJECT_PRODUCTION_URL}`
  if (parsed.VERCEL_URL) return `https://${parsed.VERCEL_URL}`
  return 'http://localhost:3000'
}

/** Validated environment. The only module that reads `process.env`. */
export const env = {
  /** Absolute path of the content directory. */
  // Content is read at build time only (pages are prerendered), so the server
  // output does not need it traced. Revisit when content is read per request.
  contentDir: path.resolve(
    /*turbopackIgnore: true*/ process.cwd(),
    parsed.CONTENT_DIR
  ),
  /** Public URL of the site, without a trailing slash. */
  siteUrl: detectSiteUrl().replace(/\/$/, ''),
  /** Drafts show in development and preview deployments, never in production. */
  showDrafts:
    parsed.NODE_ENV === 'development' || parsed.VERCEL_ENV === 'preview',
} as const
