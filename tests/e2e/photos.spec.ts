import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Expectations follow the fictional sample content in content-example/.

/** Published sample photos, newest first. */
const PUBLISHED = [
  'Low sun',
  'Tide pool',
  'Birch stand',
  'Haze over the city',
  'Window light',
]
/** A draft in the sample content; production builds must not show it. */
const DRAFT_TITLE = 'Night ferry'

/** Where the gallery gets a second and a third column. */
const MEDIUM_TIER = 768
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

/** The items of a photo's mono details row. */
function details(page: Page) {
  return page
    .getByRole('main')
    .getByRole('list', { name: 'Photo details' })
    .getByRole('listitem')
}

test.describe('gallery', () => {
  test('shows the published photos, newest first, without the draft', async ({
    page,
  }) => {
    const errors = trackErrors(page)
    await page.goto('/photos')
    const main = page.getByRole('main')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Photos' })
    ).toBeVisible()
    await expect(main.getByRole('heading', { level: 2 })).toHaveText(PUBLISHED)
    await expect(page.getByText(DRAFT_TITLE)).toHaveCount(0)

    // A tile: the photo on its dominant colour, then a mono title and date.
    const first = main.getByRole('listitem').first()
    await expect(first.getByRole('img', { name: /violet sky/ })).toBeVisible()
    await expect(first.locator('picture').locator('..')).toHaveCSS(
      'background-color',
      /^rgb\(/
    )
    await expect(
      first.getByRole('link', { name: 'Low sun', exact: true })
    ).toHaveAttribute('href', '/photos/low-sun')
    await expect(first.getByRole('link')).toHaveCSS(
      'font-family',
      /JetBrains Mono/
    )
    await expect(first.locator('time')).toHaveText('2026-11-08')
    await expect(first.locator('time')).toHaveCSS(
      'font-family',
      /JetBrains Mono/
    )

    await expectCleanPage(page, errors)
  })

  test('is a masonry of one, two or three columns that keeps aspect ratios', async ({
    page,
    viewport,
  }) => {
    await page.goto('/photos')
    const tiles = page.getByRole('main').getByRole('listitem')
    await expect(tiles).toHaveCount(PUBLISHED.length)

    const lefts = await tiles.evaluateAll(items =>
      items.map(item => Math.round(item.getBoundingClientRect().left))
    )
    const width = viewport?.width ?? 0
    const columns = width >= FULL_TIER ? 3 : width >= MEDIUM_TIER ? 2 : 1
    expect(new Set(lefts).size).toBe(columns)

    const ratios = await tiles.locator('img').evaluateAll(images =>
      images.map(image => {
        const box = image.getBoundingClientRect()
        const intrinsic =
          Number(image.getAttribute('width')) /
          Number(image.getAttribute('height'))
        return Math.abs(box.width / box.height - intrinsic)
      })
    )
    for (const difference of ratios) expect(difference).toBeLessThan(0.01)
  })

  test('is the third item of the primary navigation', async ({ page }) => {
    await page.goto('/photos')
    const nav = page.locator('nav[aria-label="Primary"]').first()
    await expect(nav.locator('a')).toHaveText([
      /Home$/,
      /Writing$/,
      /Photos$/,
      /Projects$/,
    ])
    await expect(nav.locator('a', { hasText: 'Photos' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })
})

test.describe('photo page', () => {
  test('shows the photo large, with its details, story and preview', async ({
    page,
    request,
    viewport,
  }) => {
    const errors = trackErrors(page)
    await page.goto('/photos/low-sun')
    const main = page.getByRole('main')

    // The photo comes first, inside the viewport and at most 80% as tall.
    const image = main.getByRole('img', { name: /violet sky/ })
    await expect(image).toBeInViewport()
    const box = await image.boundingBox()
    const height = viewport?.height ?? 0
    expect(box?.height ?? 0).toBeLessThanOrEqual(height * 0.8 + 1)
    expect(
      await main
        .locator('picture source[type="image/webp"]')
        .getAttribute('srcset')
    ).toContain('2048w')

    await expect(
      main.getByRole('heading', { level: 1, name: 'Low sun' })
    ).toBeVisible()
    await expect(details(page)).toHaveText([
      /2026-11-08$/,
      /Location: Exampleton, west pier$/,
      /Camera: Rangefinder R1$/,
      /Lens: 35 mm ƒ\/2$/,
      /Exposure: ƒ\/8 · 1\/500 s · ISO 100$/,
    ])
    await expect(details(page).first().locator('time')).toHaveCSS(
      'font-family',
      /JetBrains Mono/
    )
    await expect(
      main.getByText(/^We reached the end of the west pier/)
    ).toBeVisible()

    // The preview is the photo itself, at an absolute URL.
    await expect(page).toHaveTitle(/^Low sun · /)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'We reached the end of the west pier just as the light began to go.'
    )
    const preview = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content')
    expect(preview).toMatch(
      /^https?:\/\/[^/]+\/_media\/photos\/low-sun\.[0-9a-f]{12}\.2048\.webp$/
    )
    const response = await request.get(new URL(preview ?? '').pathname)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('image/webp')

    await expectCleanPage(page, errors)
  })

  test('shows only the details a photo has', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/photos/birch-stand')
    await expect(details(page)).toHaveText([
      /2026-09-30$/,
      /Camera: Field 6x7$/,
      /Lens: 90 mm ƒ\/3\.5$/,
    ])
    await expectCleanPage(page, errors)

    await page.goto('/photos/window-light')
    await expect(details(page)).toHaveText([/2026-07-03$/])
    // Without a story, the alt text describes the page.
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /^A bright, soft-edged window/
    )
  })

  test('links to the neighbouring photos and back to the gallery', async ({
    page,
  }) => {
    await page.goto('/photos/tide-pool')
    const main = page.getByRole('main')

    await expect(
      main.getByRole('link', { name: /previous Birch stand/ })
    ).toHaveAttribute('href', '/photos/birch-stand')
    await main.getByRole('link', { name: /next Low sun/ }).click()
    await expect(page).toHaveURL('/photos/low-sun')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Low sun')

    // The newest published photo has nothing newer; the draft is skipped.
    await expect(main.getByRole('link', { name: /^next/ })).toHaveCount(0)
    await expect(
      main.getByRole('link', { name: /previous Tide pool/ })
    ).toBeVisible()

    // The way back to the gallery is the breadcrumb.
    await main
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'photos' })
      .click()
    await expect(page).toHaveURL('/photos')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Photos')
  })
})

test.describe('missing photos', () => {
  // Drafts are hidden in production builds.
  for (const path of ['/photos/not-a-photo', '/photos/night-ferry']) {
    test(`${path} is a 404`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(404)
      await expect(page.getByText(DRAFT_TITLE)).toHaveCount(0)
    })
  }
})
