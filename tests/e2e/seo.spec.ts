import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { fillMetadataSegment } from 'next/dist/lib/metadata/get-metadata-route.js'

// These checks run against content-example/.
const SITE_NAME = 'Avery Example'
const PUBLISHED = [
  '/writing/a-tour-of-the-content-format',
  '/writing/designing-for-slow-networks',
  '/writing/keeping-a-work-log',
]
const DRAFT = '/writing/unfinished-thoughts-on-testing'
const PUBLISHED_PHOTOS = [
  '/photos/coastal-light',
  '/photos/ordinary-days',
  '/photos/coastal-light/low-sun',
  '/photos/coastal-light/tide-pool',
  '/photos/ordinary-days/birch-stand',
  '/photos/ordinary-days/city-haze',
  '/photos/ordinary-days/window-light',
]
const DRAFT_PHOTO = '/photos/coastal-light/night-ferry'
const UNKNOWN = '/this-page-does-not-exist'

/** Skips checks whose result is the same at every viewport and in both themes. */
function runOnce(testInfo: TestInfo): void {
  test.skip(
    testInfo.project.name !== 'desktop-light',
    'Same response in every project'
  )
}

interface FeedItem {
  title: string
  link: string
  guid: string
  pubDate: string
  description: string
  categories: string[]
}

/**
 * Parses XML with the browser's parser, so a malformed document fails the
 * test, and returns the text of every element matching `selector`.
 */
async function xmlTexts(
  page: Page,
  xml: string,
  selector: string
): Promise<string[] | null> {
  return page.evaluate(
    ([source, query]) => {
      const doc = new DOMParser().parseFromString(source, 'application/xml')
      if (doc.getElementsByTagName('parsererror').length > 0) return null
      return [...doc.querySelectorAll(query)].map(node => node.textContent)
    },
    [xml, selector] as const
  )
}

async function feedItems(page: Page, xml: string): Promise<FeedItem[] | null> {
  return page.evaluate(source => {
    const doc = new DOMParser().parseFromString(source, 'application/xml')
    if (doc.getElementsByTagName('parsererror').length > 0) return null
    if (doc.documentElement.getAttribute('version') !== '2.0') return null
    return [...doc.querySelectorAll('channel > item')].map(item => {
      const text = (name: string) => item.querySelector(name)?.textContent
      return {
        title: text('title') ?? '',
        link: text('link') ?? '',
        guid: text('guid') ?? '',
        pubDate: text('pubDate') ?? '',
        description: text('description') ?? '',
        categories: [...item.querySelectorAll('category')].map(
          category => category.textContent
        ),
      }
    })
  }, xml)
}

const pathOf = (url: string) => new URL(url).pathname

test('the RSS feed lists published posts, not drafts or photos', async ({
  page,
  request,
}, testInfo) => {
  runOnce(testInfo)
  const response = await request.get('/rss.xml')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toBe(
    'application/rss+xml; charset=utf-8'
  )

  const items = await feedItems(page, await response.text())
  expect(items, 'the feed must be well-formed RSS 2.0').not.toBeNull()
  const paths = (items ?? []).map(item => pathOf(item.link))
  expect(paths).toEqual(expect.arrayContaining(PUBLISHED))
  expect(paths).not.toContain(DRAFT)
  expect(paths.filter(path => !path.startsWith('/writing/'))).toEqual([])

  const tour = items?.find(
    item => item.title === 'A tour of the content format'
  )
  expect(tour).toMatchObject({
    pubDate: 'Tue, 10 Nov 2026 00:00:00 GMT',
    categories: ['markdown', 'writing', 'design'],
  })
  expect(tour?.guid).toBe(tour?.link)
  expect(tour?.description).not.toBe('')
})

test('the sitemap lists sections, published posts and photos, and tags', async ({
  page,
  request,
}, testInfo) => {
  runOnce(testInfo)
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)

  const urls = await xmlTexts(page, await response.text(), 'url > loc')
  expect(urls, 'the sitemap must be well-formed XML').not.toBeNull()
  const paths = (urls ?? []).map(pathOf)
  expect(paths).toEqual(
    expect.arrayContaining([
      '/',
      '/writing',
      '/photos',
      '/projects',
      ...PUBLISHED,
      ...PUBLISHED_PHOTOS,
      '/tags/design',
    ])
  )
  expect(paths).not.toContain(DRAFT)
  expect(paths).not.toContain(DRAFT_PHOTO)
})

test('robots.txt disallows everything outside production', async ({
  request,
}, testInfo) => {
  runOnce(testInfo)
  // The local production build is not a Vercel production deployment.
  const response = await request.get('/robots.txt')
  expect(response.status()).toBe(200)
  const lines = (await response.text())
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
  expect(lines).toEqual(['User-Agent: *', 'Disallow: /'])
})

test('Open Graph images and icons are PNGs', async ({
  page,
  request,
}, testInfo) => {
  runOnce(testInfo)
  await page.goto('/')
  const head = page.locator('head')
  const advertised = await Promise.all([
    head.locator('meta[property="og:image"]').getAttribute('content'),
    head.locator('link[rel="icon"]').getAttribute('href'),
    head.locator('link[rel="apple-touch-icon"]').getAttribute('href'),
  ])
  // Next.js derives a post image's URL from its route segment; this is the
  // URL a post page advertises in og:image.
  const postImage = fillMetadataSegment(
    '/(site)/writing/[slug]',
    { slug: 'keeping-a-work-log' },
    'opengraph-image',
    false
  )

  for (const url of [...advertised, postImage]) {
    expect(url).toBeTruthy()
    const response = await request.get(new URL(url ?? '', page.url()).pathname)
    expect(response.status(), url ?? '').toBe(200)
    expect(response.headers()['content-type']).toBe('image/png')
  }
})

test('unknown URLs get an accessible 404 page', async ({ page }) => {
  const response = await page.goto(UNKNOWN)
  expect(response?.status()).toBe(404)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Page not found' })
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Back to the home page' })
  ).toHaveAttribute('href', '/')

  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(violations.map(v => `${v.id}: ${v.help}`)).toEqual([])
})

test('legacy URLs permanently redirect to their replacements', async ({
  request,
}, testInfo) => {
  runOnce(testInfo)
  for (const [path, destination] of [
    ['/blogs', '/writing'],
    ['/blogs/an-old-post', '/writing'],
    ['/blogs/an-old-post/nested', '/writing'],
    ...[
      '/contact',
      '/profiles',
      '/login',
      '/signup',
      '/signup/confirm',
      '/forget_password',
      '/update_password',
      '/error',
      '/callback',
      '/confirm/reset_password',
      '/confirm/signup',
      '/signout',
    ].map(path => [path, '/'] as const),
  ] as const) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status(), path).toBe(308)
    expect(response.headers().location, path).toBe(destination)
  }
  // This route belongs to both versions and must not be redirected.
  expect((await request.get('/projects', { maxRedirects: 0 })).status()).toBe(
    200
  )
})

test('responses carry the security headers', async ({ request }, testInfo) => {
  runOnce(testInfo)
  for (const path of ['/', '/rss.xml', UNKNOWN]) {
    const response = await request.get(path)
    expect(response.headers(), path).toMatchObject({
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'permissions-policy': 'camera=(), microphone=(), geolocation=()',
      'x-frame-options': 'DENY',
    })
  }
})

test('page titles follow the site template', async ({ page }, testInfo) => {
  runOnce(testInfo)
  await page.goto('/')
  await expect(page).toHaveTitle(SITE_NAME)

  await page.goto(UNKNOWN)
  await expect(page).toHaveTitle(`Page not found · ${SITE_NAME}`)

  // Every other page either keeps the default or fills in the template.
  const titled = new RegExp(`^(?:.+ · )?${SITE_NAME}$`)
  for (const path of [
    '/writing',
    '/photos',
    '/photos/coastal-light',
    '/photos/coastal-light/low-sun',
    '/projects',
  ]) {
    await page.goto(path)
    await expect(page).toHaveTitle(titled)
  }
})
