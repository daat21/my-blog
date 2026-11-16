import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const ALBUM = '/photos/coastal-light'
const PHOTO = `${ALBUM}/low-sun`

async function expectCleanPage(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  ).toBe(false)
  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(
    violations.map(violation => `${violation.id}: ${violation.help}`)
  ).toEqual([])
}

test('the year-grouped index links album rows with reserved 4:3 covers', async ({
  page,
}) => {
  await page.goto('/photos')
  const main = page.getByRole('main')
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Photos')
  await expect(main.getByRole('heading', { level: 2 })).toHaveText('2026')
  await expect(main.getByRole('heading', { level: 3 })).toHaveText([
    'Coastal light',
    'Ordinary days',
  ])
  const row = main.getByRole('link', { name: /Coastal light/ })
  await expect(row).toHaveAttribute('href', ALBUM)
  await expect(row).toContainText('2 photos')
  const cover = await row.locator('picture').locator('..').boundingBox()
  expect((cover?.width ?? 0) / (cover?.height ?? 1)).toBeCloseTo(4 / 3, 1)
  await expect(main.getByText('Night ferry')).toHaveCount(0)
  await expectCleanPage(page)
  await row.click()
  await expect(page).toHaveURL(ALBUM)
})

test('the album masonry keeps image ratios and captions in chronological order', async ({
  page,
  viewport,
}) => {
  await page.goto('/photos/ordinary-days')
  const main = page.getByRole('main')
  const grid = main.getByRole('list', { name: 'Photos in this album' })
  await expect(grid.getByRole('heading', { level: 2 })).toHaveText([
    'Haze over the city',
    'Birch stand',
    'Window light',
  ])
  const columns =
    (viewport?.width ?? 0) >= 1280 ? 3 : (viewport?.width ?? 0) >= 768 ? 2 : 1
  await expect(grid).toHaveCSS('column-count', String(columns))
  await expect(grid.locator('time')).toHaveText(['2026-08-14', '2026-09-30'])
  for (const img of await grid.locator('img').all()) {
    const ratio = await img.evaluate(image => {
      const box = image.getBoundingClientRect()
      return (
        box.width / box.height -
        Number(image.getAttribute('width')) /
          Number(image.getAttribute('height'))
      )
    })
    expect(Math.abs(ratio)).toBeLessThan(0.01)
  }
  await expect(main.getByRole('link', { name: /all albums/ })).toHaveAttribute(
    'href',
    '/photos'
  )
  await expectCleanPage(page)
  await page.goto(ALBUM)
  await expect(
    page.getByRole('list', { name: 'Photos in this album' }).locator('time')
  ).toHaveText(['10:04', '18:42'])
  await expect(page.getByRole('link', { name: /older album/ })).toHaveAttribute(
    'href',
    '/photos/ordinary-days'
  )
})

test('the album intro aligns with the header and stays within the reading width', async ({
  page,
}) => {
  await page.goto(ALBUM)
  const main = page.getByRole('main')
  const heading = await main.getByRole('heading', { level: 1 }).boundingBox()
  const intro = await main
    .getByText('A few quiet moments by the water, from low tide to sunset.', {
      exact: true,
    })
    .boundingBox()
  if (!heading || !intro) throw new Error('Missing album heading or intro')
  expect(intro.x).toBe(heading.x)
  expect(intro.width).toBeLessThanOrEqual(690)
  expect(intro.x + intro.width).toBeLessThanOrEqual(heading.x + heading.width)
  await expectCleanPage(page)
})

test('photo layout is two columns only at full tier, otherwise stacked', async ({
  page,
  viewport,
}) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(PHOTO)
  const main = page.getByRole('main')
  const image = main.locator('figure img')
  const heading = main.getByRole('heading', { level: 1 })
  await expect(heading).toHaveText('Low sun')
  const frame = await main.locator('figure').boundingBox()
  const title = await heading.boundingBox()
  if (!frame || !title) throw new Error('Missing image frame or heading')
  if ((viewport?.width ?? 0) >= 1280) {
    expect(title.x).toBeGreaterThan(frame.x + frame.width)
    await expect(
      main.getByRole('navigation', { name: 'Photos in this album' })
    ).toBeVisible()
    await expect(
      main.getByRole('link', { name: '2. Low sun' })
    ).toHaveAttribute('aria-current', 'page')
  } else {
    expect(title.y).toBeGreaterThan(frame.y + frame.height)
    if ((viewport?.width ?? 0) < 768) {
      expect(frame.x).toBe(0)
      expect(frame.width).toBe(viewport?.width)
    }
  }
  await expect(image).toBeVisible()
  await expect(
    main.locator('figure source[type="image/webp"]')
  ).toHaveAttribute('srcset', /2048w/)
  await expect(
    main.getByText(/^We reached the end of the west pier/)
  ).toBeVisible()
  await expect(
    main.getByRole('navigation', { name: 'Photo navigation' })
  ).toContainText(/2\s*(?:of|\/)\s*2/, { useInnerText: true })
  await expect(main.locator('dl dt')).toHaveText([
    'Camera',
    'Lens',
    'Focal length',
    'Aperture',
    'Shutter',
    'ISO',
    'Taken',
    'Place',
  ])
  await expect(main.locator('dl dd')).toHaveText([
    'Rangefinder R1',
    '35 mm ƒ/2',
    '35 mm',
    'ƒ/8',
    '1/500 s',
    '100',
    '2026-11-08 · 18:42',
    'Exampleton, west pier',
  ])
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /low-sun\.[a-f0-9]{12}\.2048\.webp$/
  )
  await expectCleanPage(page)
  expect(errors).toEqual([])
})

test('previous/next, counter, arrow keys and breadcrumb stay within the album', async ({
  page,
}) => {
  await page.goto(PHOTO)
  const nav = page.getByRole('navigation', { name: 'Photo navigation' })
  await expect(nav.getByRole('link', { name: /Next/ })).toHaveCount(0)
  await nav.getByRole('link', { name: /Previous/ }).click()
  await expect(page).toHaveURL(`${ALBUM}/tide-pool`)
  await expect(nav).toContainText(/1\s*(?:of|\/)\s*2/, { useInnerText: true })
  await expect(nav.getByRole('link', { name: /Previous/ })).toHaveCount(0)
  await page.keyboard.press('ArrowRight')
  await expect(page).toHaveURL(PHOTO)
  await page.keyboard.press('ArrowLeft')
  await expect(page).toHaveURL(`${ALBUM}/tide-pool`)
  await page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByRole('link', { name: 'coastal-light', exact: true })
    .click()
  await expect(page).toHaveURL(ALBUM)
})

test('full-tier frames stay fixed across aspect ratios and long thumbnail rails scroll internally', async ({
  page,
  viewport,
}) => {
  test.skip((viewport?.width ?? 0) < 1280, 'Full-tier layout only')
  await page.goto('/photos/ordinary-days/birch-stand')
  const portrait = await page.locator('main figure').boundingBox()
  await page.goto('/photos/ordinary-days/city-haze')
  const landscape = await page.locator('main figure').boundingBox()
  expect(portrait?.height).toBe(landscape?.height)
  expect(portrait?.width).toBe(landscape?.width)
  const rail = page.getByRole('navigation', { name: 'Photos in this album' })
  const scrolls = await rail.evaluate(element => {
    const list = element.querySelector('ol')
    const thumbnail = list?.firstElementChild
    if (!list || !thumbnail) throw new Error('Missing thumbnail rail')
    for (let index = 0; index < 30; index++)
      list.append(thumbnail.cloneNode(true))
    element.scrollLeft = element.scrollWidth
    return element.scrollWidth > element.clientWidth && element.scrollLeft > 0
  })
  expect(scrolls).toBe(true)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  ).toBe(false)
})

test('only filled parameters show, including the album location fallback', async ({
  page,
}) => {
  await page.goto(`${ALBUM}/tide-pool`)
  await expect(page.locator('main dl dt')).toHaveText(['Taken', 'Place'])
  await expect(page.locator('main dl dd')).toHaveText([
    '2026-10-21 · 10:04',
    'Sample Bay',
  ])
  await expectCleanPage(page)
  await page.goto('/photos/ordinary-days/window-light')
  await expect(page.locator('main dl')).toHaveCount(0)
  await expectCleanPage(page)
})

for (const path of [
  '/photos/missing',
  `${ALBUM}/missing`,
  `${ALBUM}/night-ferry`,
  '/photos/__placeholder__/__placeholder__',
]) {
  test(`${path} responds with a real 404`, async ({ page }) => {
    expect((await page.goto(path))?.status()).toBe(404)
  })
}
