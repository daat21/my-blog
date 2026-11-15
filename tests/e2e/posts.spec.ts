import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

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

  test('notes lists the notes', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/notes')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Notes' })
    ).toBeVisible()
    await expect(listedTitles(page)).toHaveText([
      'A tiny CSS reset',
      'Git aliases I use daily',
    ])
    await expect(
      page.getByRole('link', { name: 'A tiny CSS reset' })
    ).toHaveAttribute('href', '/notes/a-tiny-css-reset')

    await expectCleanPage(page, errors)
  })

  test('a tag page lists posts with the tag from both collections', async ({
    page,
  }) => {
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

    await page.goto('/tags/css')
    await expect(listedTitles(page)).toHaveText(['A tiny CSS reset'])
    // Lists that mix collections name each post's collection.
    await expect(
      page.getByRole('main').getByRole('listitem').first()
    ).toContainText('note')
  })
})

test.describe('article', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

  test('renders every content feature', async ({ page }) => {
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
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toBe('.prose {\n  max-width: 65ch;\n  line-height: 1.7;\n}')
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

  test('a note renders with its own breadcrumb and metadata', async ({
    page,
  }) => {
    const errors = trackErrors(page)
    await page.goto('/notes/a-tiny-css-reset')

    await expect(
      page.getByRole('heading', { level: 1, name: 'A tiny CSS reset' })
    ).toBeVisible()
    await expect(
      page
        .getByRole('navigation', { name: 'Breadcrumb' })
        .getByRole('link', { name: 'notes' })
    ).toHaveAttribute('href', '/notes')
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      'content',
      'article'
    )
    await expect(
      page.locator('meta[property="article:published_time"]')
    ).toHaveAttribute('content', '2026-10-30')
    await expect(page.locator('meta[property="article:tag"]')).toHaveAttribute(
      'content',
      'css'
    )
    await expect(page).toHaveTitle(/A tiny CSS reset/)

    await expectCleanPage(page, errors)
  })
})

test.describe('missing pages', () => {
  for (const path of [
    '/writing/not-a-post',
    '/notes/not-a-note',
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
