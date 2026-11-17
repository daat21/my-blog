import path from 'node:path'

import { z } from 'zod'

const optionalText = z.preprocess(
  value => (value === '' ? undefined : value),
  z.string().min(1).optional()
)

const schema = z.object({
  NEXT_PHASE: z.string().optional(),
  CONTENT_SOURCE: z.enum(['filesystem', 'github']).optional(),
  CONTENT_REPO: optionalText,
  CONTENT_REPO_TOKEN: optionalText,
  CONTENT_REPO_REF: optionalText,
  CONTENT_REVALIDATE_SECRET: z.preprocess(
    value => (value === '' ? undefined : value),
    z
      .string()
      .regex(/^[a-f0-9]{64,}$/)
      .optional()
  ),
  CONTENT_GITHUB_API_URL: z.url().optional(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
  /** Directory holding the content; defaults to the bundled examples. */
  CONTENT_DIR: optionalText,
  /** Overrides the detected public URL of the site. */
  SITE_URL: z.url().optional(),
})

/** Validates server content settings, including the local-only API override. */
export function contentSettings(input: Record<string, unknown>) {
  const value = schema.parse(input)
  const source =
    value.CONTENT_SOURCE ??
    (value.VERCEL_ENV === 'production' || value.VERCEL_ENV === 'preview'
      ? 'github'
      : 'filesystem')
  const repo = value.CONTENT_REPO
  if (repo && !/^[a-zA-Z0-9][\w.-]*\/[a-zA-Z0-9][\w.-]*$/.test(repo))
    throw new Error('Invalid CONTENT_REPO')
  if (source === 'github' && (!repo || !value.CONTENT_REPO_TOKEN))
    throw new Error(
      'GitHub content requires CONTENT_REPO and CONTENT_REPO_TOKEN'
    )
  const apiUrl = new URL(
    value.CONTENT_GITHUB_API_URL ?? 'https://api.github.com'
  )
  if (
    value.CONTENT_GITHUB_API_URL &&
    (value.VERCEL_ENV ||
      apiUrl.protocol !== 'http:' ||
      !['localhost', '127.0.0.1', '[::1]'].includes(apiUrl.hostname) ||
      apiUrl.username ||
      apiUrl.password ||
      apiUrl.pathname !== '/' ||
      apiUrl.search ||
      apiUrl.hash)
  ) {
    throw new Error('CONTENT_GITHUB_API_URL is only allowed on local loopback')
  }
  return {
    source,
    repo,
    token: value.CONTENT_REPO_TOKEN,
    ref: value.CONTENT_REPO_REF ?? 'main',
    secret: value.CONTENT_REVALIDATE_SECRET,
    apiUrl: apiUrl.origin,
    isBuild: value.NEXT_PHASE === 'phase-production-build',
  }
}

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
  content: contentSettings(process.env),
  /** Absolute build/development input directory; never a runtime content mount. */
  contentDir: path.resolve(
    /*turbopackIgnore: true*/ process.cwd(),
    parsed.CONTENT_DIR ??
      (parsed.CONTENT_REPO && parsed.CONTENT_REPO_TOKEN
        ? '.content'
        : 'content-example')
  ),
  /** Public URL of the site, without a trailing slash. */
  siteUrl: detectSiteUrl().replace(/\/$/, ''),
  /** Drafts show in development and preview deployments, never in production. */
  showDrafts:
    parsed.NODE_ENV === 'development' || parsed.VERCEL_ENV === 'preview',
  /** Next dev needs eval and WebSockets; production builds must not allow them. */
  isDevelopment: parsed.NODE_ENV === 'development',
  /** True only on the Vercel production deployment. */
  isProduction: parsed.VERCEL_ENV === 'production',
} as const
