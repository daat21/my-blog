import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from './fixtures'

/** The sample post that uses every Markdown feature. */
const TOUR = '/writing/a-tour-of-the-content-format'
/** A draft in the sample content; production builds must not show it. */
const DRAFT_TITLE = 'Unfinished thoughts on testing'

/** The width from which the table of contents is a right-hand rail. */
const FULL_TIER = 1280

/** Collects uncaught errors and console errors while a test runs. */
function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

/** No horizontal scrolling, no axe violations and no errors. */
async function expectCleanPage(page: Page, errors: string[]) {
  const overflowsHorizontally = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  )
  expect(overflowsHorizontally, 'page must not scroll horizontally').toBe(false)

  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(violations.map(v => `${v.id}: ${v.help}`)).toEqual([])

  expect(errors).toEqual([])
}

/** Titles of the posts listed in the main content, in order. */
function listedTitles(page: Page) {
  return page.getByRole('main').getByRole('heading', { level: 2 })
}

test.describe('post lists', () => {
  for (const path of ['/writing', '/tags/design']) {
    test(`covers reserve a small right-hand box only for illustrated posts: ${path}`, async ({
      page,
      viewport,
    }) => {
      await page.goto(path)
      const rows = page.locator('main article')
      const illustrated = rows.filter({
        hasText: 'A tour of the content format',
      })
      const plain = rows.filter({ hasText: 'Designing for slow networks' })
      const image = illustrated.getByRole('img', {
        name: 'A wireframe of a page with a sidebar on the left and a content column with a heading, text lines and an image placeholder',
        exact: true,
      })
      await expect(image).toHaveAttribute('width', '1200')
      await expect(image).toHaveAttribute('height', '750')
      await expect(image).toHaveAttribute('loading', 'eager')
      await expect(image).toHaveCSS('object-fit', 'cover')
      const width = (viewport?.width ?? 0) >= 768 ? 112 : 80
      await expect(image).toHaveCSS('width', `${width}px`)
      await expect(image).toHaveCSS('height', `${(width * 3) / 4}px`)
      await expect(plain.locator('picture, img')).toHaveCount(0)
      const geometry = await illustrated.evaluate(row => {
        const img = row.querySelector('img')
        const title = row.querySelector('h2')
        if (!img || !title) throw new Error('Missing cover or title')
        return {
          imageX: img.getBoundingClientRect().x,
          titleX: title.getBoundingClientRect().x,
          titleRight: title.getBoundingClientRect().right,
        }
      })
      expect(geometry.imageX).toBeGreaterThanOrEqual(geometry.titleRight)
      const plainTitle = await plain.locator('h2').boundingBox()
      expect(plainTitle?.x).toBeCloseTo(geometry.titleX, 0)
      await expect
        .poll(() => image.evaluate(img => (img as HTMLImageElement).currentSrc))
        .toMatch(/\.640\.avif$/)
      // The reserved crop survives failed or disabled image loading.
      await page.route('**/_media/**', route => route.abort())
      await page.reload()
      await expect(image).toHaveCSS('height', `${(width * 3) / 4}px`)
    })
  }

  test('writing lists published posts, newest first, without drafts', async ({
    page,
  }) => {
    const errors = trackErrors(page)
    await page.goto('/writing')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Writing' })
    ).toBeVisible()
    await expect(listedTitles(page)).toHaveText([
      'A tour of the content format',
      'Designing for slow networks',
      'Keeping a work log',
    ])
    await expect(page.getByText(DRAFT_TITLE)).toHaveCount(0)

    const first = page.getByRole('main').getByRole('listitem').first()
    await expect(first.locator('time')).toHaveText('2026-11-10')
    await expect(first.locator('time')).toHaveCSS(
      'font-family',
      /JetBrains Mono/
    )
    await expect(
      first.getByText('Every Markdown feature this site supports')
    ).toBeVisible()
    await expect(
      first.getByRole('link', { name: '#markdown' })
    ).toHaveAttribute('href', '/tags/markdown')
    await expect(
      first.getByRole('link', { name: 'A tour of the content format' })
    ).toHaveAttribute('href', TOUR)

    await expectCleanPage(page, errors)
  })

  test('a tag page lists the posts with the tag', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/tags/design')

    await expect(
      page.getByRole('heading', { level: 1, name: '#design' })
    ).toBeVisible()
    await expect(listedTitles(page)).toHaveText([
      'A tour of the content format',
      'Designing for slow networks',
    ])
    await expectCleanPage(page, errors)

    await expect(
      page.getByText('2 posts tagged “design”, newest first.', { exact: true })
    ).toBeVisible()

    await page.goto('/tags/habits')
    await expect(listedTitles(page)).toHaveText(['Keeping a work log'])
    await expect(
      page.getByText('1 post tagged “habits”, newest first.', { exact: true })
    ).toBeVisible()
  })
})

test.describe('article', () => {
  // Clipboard permissions exist only in Chromium; other engines still show
  // the "copied" status, which is what the copy test checks there.
  test.beforeEach(async ({ context, browserName }) => {
    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    }
  })

  test('renders every content feature', async ({ page, browserName }) => {
    const errors = trackErrors(page)
    await page.goto(TOUR)
    const main = page.getByRole('main')

    // Header: breadcrumb, title, dek and meta row.
    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' })
    await expect(
      breadcrumb.getByRole('link', { name: 'writing' })
    ).toHaveAttribute('href', '/writing')
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
      'a-tour-of-the-content-format'
    )
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'A tour of the content format',
      })
    ).toBeVisible()
    await expect(main.locator('header time').first()).toHaveAttribute(
      'datetime',
      '2026-11-10'
    )
    await expect(main.getByText('2 min read')).toBeVisible()
    await expect(
      main.locator('header').getByRole('link', { name: '#design' })
    ).toHaveAttribute('href', '/tags/design')

    // Headings, with the ## marker hidden from their accessible names.
    for (const name of ['Text and links', 'Media', 'Callouts', 'Code']) {
      await expect(main.getByRole('heading', { level: 2, name })).toBeVisible()
    }
    await expect(
      main.getByRole('heading', { level: 2, name: 'Code' })
    ).toHaveAttribute('id', 'code')

    // External links open safely.
    await expect(
      main.getByRole('link', { name: 'CommonMark' })
    ).toHaveAttribute('rel', 'noopener noreferrer')

    // Ordered lists use mono, zero-padded numbers.
    await expect(
      main.locator('ol > li', { hasText: 'Draft the post.' })
    ).toHaveText('01Draft the post.')

    // Code block: title, line numbers from CSS, and a working copy button.
    const titled = main.locator('figure', { hasText: 'styles/prose.css' })
    await expect(titled.locator('pre .line')).toHaveCount(4)
    await titled.getByRole('button', { name: 'Copy code' }).click()
    await expect(titled.getByRole('status')).toHaveText('Copied to clipboard')
    if (browserName === 'chromium') {
      const copied = await page.evaluate(() => navigator.clipboard.readText())
      expect(copied).toBe(
        '.prose {\n  max-width: 65ch;\n  line-height: 1.7;\n}'
      )
    }
    await expect(main.getByRole('button', { name: 'Copy code' })).toHaveCount(3)

    // Callouts.
    const callouts = main.getByRole('note')
    await expect(callouts).toHaveCount(2)
    await expect(callouts.first()).toContainText('Note.')
    await expect(callouts.last()).toContainText('Warning.')

    // Image figure.
    const image = main.getByRole('img', { name: /A wireframe of a page/ })
    await expect(image).toHaveAttribute(
      'sizes',
      '(min-width: 768px) 690px, 100vw'
    )
    await expect(
      main
        .locator('figure', { has: page.locator('picture') })
        .locator('figcaption')
    ).toHaveText('Fig. 1 — The layout sketch, before any styles.')

    // Video figure: plays muted and looping, and can be paused.
    const clip = main.locator('figure', { has: page.locator('video') })
    const video = clip.locator('video')
    await expect(clip.locator('figcaption')).toHaveText(
      'Fig. 2 — The sidebar collapsing and reopening.'
    )
    await expect(video).toHaveJSProperty('muted', true)
    await expect(video).toHaveJSProperty('loop', true)
    await expect(video).toHaveJSProperty('paused', false)
    await expect(video).toHaveJSProperty('controls', false)
    await clip.getByRole('button', { name: 'Pause clip' }).click()
    await expect(video).toHaveJSProperty('paused', true)
    await expect(clip.getByRole('button', { name: 'Play clip' })).toBeVisible()

    // Footer: the neighbouring post and the issue link.
    await expect(
      main.getByRole('link', { name: /previous Designing for slow networks/ })
    ).toHaveAttribute('href', '/writing/designing-for-slow-networks')
    await expect(
      main.getByRole('link', { name: /Report an issue/ })
    ).toHaveAttribute('href', 'https://github.com/daat21/my-blog/issues/new')

    await expectCleanPage(page, errors)
  })

  test('shows the table of contents as a rail or a collapsible block', async ({
    page,
    viewport,
  }) => {
    await page.goto(TOUR)
    const main = page.getByRole('main')
    const collapsible = main.locator('details', { hasText: 'On this page' })

    if ((viewport?.width ?? 0) >= FULL_TIER) {
      await expect(collapsible).toBeHidden()
      const rail = page.getByRole('navigation', { name: 'On this page' })
      await expect(rail).toBeVisible()
      await expect(rail.getByRole('list').getByRole('link')).toHaveText([
        'Text and links',
        'Lists',
        'Tables',
        'Media',
        'Callouts',
        'Code',
        'Shell commands',
      ])
      await expect(
        rail.getByRole('link', { name: 'back to top' })
      ).toHaveAttribute('href', '#top')
      await rail.getByRole('link', { name: 'Callouts' }).click()
    } else {
      await expect(collapsible).toBeVisible()
      await expect(collapsible).toHaveJSProperty('open', false)
      await collapsible.locator('summary').click()
      const toc = collapsible.getByRole('navigation', { name: 'On this page' })
      await expect(toc.getByRole('link')).toHaveCount(7)
      await toc.getByRole('link', { name: 'Callouts' }).click()
    }

    await expect(page).toHaveURL(/#callouts$/)
    await expect(
      main.getByRole('heading', { level: 2, name: 'Callouts' })
    ).toBeInViewport()
  })

  test('does not autoplay the clip when motion is reduced', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(TOUR)
    const video = page.locator('main video')
    await video.scrollIntoViewIfNeeded()
    await expect(video).toHaveJSProperty('controls', true)
    await expect(video).toHaveJSProperty('paused', true)
    await expect(page.getByRole('button', { name: 'Pause clip' })).toHaveCount(
      0
    )
  })

  test('a post carries Open Graph article metadata', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/writing/keeping-a-work-log')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Keeping a work log' })
    ).toBeVisible()
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      'content',
      'article'
    )
    await expect(
      page.locator('meta[property="article:published_time"]')
    ).toHaveAttribute('content', '2026-05-04')
    const tags = page.locator('meta[property="article:tag"]')
    await expect(tags).toHaveCount(2)
    await expect(tags.first()).toHaveAttribute('content', 'writing')
    await expect(tags.last()).toHaveAttribute('content', 'habits')
    await expect(page).toHaveTitle(/Keeping a work log/)

    await expectCleanPage(page, errors)
  })
})

test.describe('missing pages', () => {
  for (const path of [
    '/writing/not-a-post',
    '/tags/not-a-tag',
    // Drafts are hidden in production builds, and so are their tags.
    '/writing/unfinished-thoughts-on-testing',
    '/tags/drafts',
  ]) {
    test(`${path} is a 404`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(404)
      await expect(page.getByText(DRAFT_TITLE)).toHaveCount(0)
    })
  }
})
