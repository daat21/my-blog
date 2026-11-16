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
  expect(title.y + title.height).toBeLessThan(frame.y)
  expect(
    await heading.evaluate(element =>
      Boolean(
        element.compareDocumentPosition(
          document.querySelector('main figure') as Node
        ) & Node.DOCUMENT_POSITION_FOLLOWING
      )
    )
  ).toBe(true)
  const counter = await main
    .getByLabel('Photo position')
    .locator('visible=true')
    .boundingBox()
  if (!counter) throw new Error('Missing photo counter')
  expect(
    Math.abs(counter.x + counter.width / 2 - (frame.x + frame.width / 2))
  ).toBeLessThanOrEqual(2)
  if ((viewport?.width ?? 0) >= 1280) {
    expect(title.x).toBe(frame.x)
    await expect(
      main.getByRole('navigation', { name: 'Photos in this album' })
    ).toBeVisible()
    await expect(
      main.getByRole('link', { name: '2. Low sun' })
    ).toHaveAttribute('aria-current', 'page')
  } else {
    const row = await main
      .getByRole('navigation', { name: 'Photo navigation' })
      .boundingBox()
    if (!row) throw new Error('Missing navigation row')
    expect(
      Math.abs(counter.x + counter.width / 2 - (row.x + row.width / 2))
    ).toBeLessThanOrEqual(2)
    expect(row.y).toBeGreaterThanOrEqual(frame.y + frame.height)
    await expect(main.locator('figure').getByRole('navigation')).toBeHidden()
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
    main.getByLabel('Photo position').locator('visible=true')
  ).toHaveText(/2\s*\/\s*2/)
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

test('scrolling leaves portrait photo sizing stable without nested scrollports', async ({
  page,
}) => {
  await page.goto('/photos/ordinary-days/birch-stand')
  const image = page.locator('main figure img')
  const before = await image.boundingBox()
  if (!before) throw new Error('Missing portrait photo')
  const scrollports = await image.evaluate(element => {
    const problems: string[] = []
    for (
      let parent = element.parentElement;
      parent;
      parent = parent.parentElement
    ) {
      const style = getComputedStyle(parent)
      if (style.scrollbarGutter !== 'auto')
        problems.push(`${parent.tagName}: scrollbar gutter`)
      // The document owns scrolling, not an ancestor around the photo.
      if (
        parent !== document.body &&
        parent !== document.documentElement &&
        [style.overflowX, style.overflowY].some(value =>
          ['auto', 'scroll', 'hidden'].includes(value)
        )
      )
        problems.push(`${parent.tagName}: nested scrollport`)
    }
    return problems
  })
  expect(scrollports).toEqual([])
  await page.evaluate(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    })
  })
  const after = await image.boundingBox()
  if (!after) throw new Error('Missing portrait photo after scrolling')
  expect(after.width).toBeCloseTo(before.width, 1)
  expect(after.height).toBeCloseTo(before.height, 1)
})

test('previous/next, counter, arrow keys and breadcrumb stay within the album', async ({
  page,
}) => {
  await page.goto(PHOTO)
  const nav = page.getByRole('navigation', { name: 'Photo navigation' })
  await expect(nav.getByRole('link', { name: /Next/ })).toHaveCount(0)
  await expect(nav.locator('[aria-disabled="true"]')).toHaveAttribute(
    'aria-label',
    'Next photo'
  )
  await nav.getByRole('link', { name: /Previous/ }).click()
  await expect(page).toHaveURL(`${ALBUM}/tide-pool`)
  await expect(
    page.getByLabel('Photo position').locator('visible=true')
  ).toHaveText(/1\s*\/\s*2/)
  await expect(nav.getByRole('link', { name: /Previous/ })).toHaveCount(0)
  await expect(nav.locator('[aria-disabled="true"]')).toHaveAttribute(
    'aria-label',
    'Previous photo'
  )
  await nav.getByRole('link', { name: 'Next photo: Low sun' }).click()
  await expect(page).toHaveURL(PHOTO)
  let current = PHOTO
  for (const [key, path] of [
    ['ArrowLeft', `${ALBUM}/tide-pool`],
    ['ArrowRight', PHOTO],
    ['ArrowLeft', `${ALBUM}/tide-pool`],
  ] as const) {
    await expect(page.locator('[data-photo-keyboard-ready]')).toHaveAttribute(
      'data-photo-keyboard-ready',
      current
    )
    await page.keyboard.press(key)
    await expect(page).toHaveURL(path)
    current = path
  }
  await page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByRole('link', { name: 'coastal-light', exact: true })
    .click()
  await expect(page).toHaveURL(ALBUM)
})

test('full-tier viewer fills the main gutters with centred controls and right-aligned details', async ({
  page,
  viewport,
}) => {
  test.skip((viewport?.width ?? 0) < 1280, 'Full-tier layout only')
  if (!viewport) throw new Error('Missing project viewport')
  for (const size of [viewport, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(size)
    await page.goto(PHOTO)
    const main = page.getByRole('main')
    const frame = await main.locator('figure').boundingBox()
    const details = await main
      .getByRole('region', { name: 'Photo details' })
      .boundingBox()
    const title = await main.getByRole('heading', { level: 1 }).boundingBox()
    const counter = await main
      .getByLabel('Photo position')
      .locator('visible=true')
      .boundingBox()
    const rail = main.getByRole('navigation', { name: 'Photos in this album' })
    const thumbnails = await rail.locator('ol').boundingBox()
    const footer = await main.locator('footer').boundingBox()
    const mainBox = await main.boundingBox()
    if (
      !frame ||
      !details ||
      !title ||
      !counter ||
      !thumbnails ||
      !footer ||
      !mainBox
    )
      throw new Error('Missing viewer layout')
    const gutter = await main
      .locator(':scope > div')
      .evaluate(element => parseFloat(getComputedStyle(element).paddingRight))
    expect(Math.abs(frame.x - mainBox.x - gutter)).toBeLessThanOrEqual(1)
    expect(
      Math.abs(size.width - details.x - details.width - gutter)
    ).toBeLessThanOrEqual(1)
    expect(details.width).toBe(300)
    expect(details.y).toBe(frame.y)
    await expect(main.getByRole('region', { name: 'Photo details' })).toHaveCSS(
      'position',
      'sticky'
    )
    expect(title.x).toBe(frame.x)
    expect(title.y + title.height).toBeLessThan(frame.y)
    for (const box of [counter, thumbnails])
      expect(
        Math.abs(box.x + box.width / 2 - frame.x - frame.width / 2)
      ).toBeLessThanOrEqual(2)
    expect(thumbnails.y + thumbnails.height).toBeLessThanOrEqual(size.height)
    expect(footer.x).toBe(frame.x)
    expect(footer.x + footer.width).toBe(details.x + details.width)
    const controls = main.getByRole('navigation', { name: 'Photo navigation' })
    for (const [index, control] of (
      await controls.locator('a, [aria-disabled="true"]').all()
    ).entries()) {
      const box = await control.boundingBox()
      if (!box) throw new Error('Missing photo control')
      expect(box.width).toBeCloseTo(44, 2)
      expect(box.height).toBeCloseTo(44, 2)
      expect(box.x).toBeGreaterThanOrEqual(frame.x)
      expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width)
      expect(
        Math.abs(box.y + box.height / 2 - frame.y - frame.height / 2)
      ).toBeLessThanOrEqual(1)
      expect(
        index === 0
          ? box.x < frame.x + frame.width / 2
          : box.x > frame.x + frame.width / 2
      ).toBe(true)
      expect(
        await control.evaluate(element =>
          parseFloat(getComputedStyle(element).borderRadius)
        )
      ).toBeGreaterThanOrEqual(22)
    }
    await expectCleanPage(page)
  }
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
