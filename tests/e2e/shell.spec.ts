import { expect, test, type Page } from './fixtures'

/** Below 1024px the sidebar becomes a menu sheet behind a top-bar button. */
function hasMenu(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) < 1024
}

test.describe('mobile menu', () => {
  test('opens and closes with its buttons', async ({ page }) => {
    test.skip(!hasMenu(page), 'The persistent sidebar replaces the menu')
    await page.goto('/')
    const dialog = page.getByRole('dialog', { name: 'Site menu' })

    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(dialog).toBeVisible()

    await page.getByRole('button', { name: 'Close menu' }).click()
    await expect(dialog).toBeHidden()
  })

  test('closes with Escape', async ({ page }) => {
    test.skip(!hasMenu(page), 'The persistent sidebar replaces the menu')
    await page.goto('/')
    const dialog = page.getByRole('dialog', { name: 'Site menu' })

    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('closes after navigating', async ({ page }) => {
    test.skip(!hasMenu(page), 'The persistent sidebar replaces the menu')
    await page.goto('/')
    const dialog = page.getByRole('dialog', { name: 'Site menu' })

    await page.getByRole('button', { name: 'Open menu' }).click()
    await dialog.getByRole('link', { name: /Writing/ }).click()
    await expect(page).toHaveURL(/\/writing$/)
    await expect(dialog).toBeHidden()
  })
})

test('menu backdrop darkens the page', async ({ page }) => {
  test.skip(!hasMenu(page), 'The persistent sidebar replaces the menu')
  await page.goto('/')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('dialog', { name: 'Site menu' })).toBeVisible()

  // Composite the backdrop colour over the page background and compare
  // luminance: the result must be darker in both colour schemes.
  const { plain, dimmed } = await page.evaluate(() => {
    const channels = (colour: string) =>
      (colour.match(/[\d.]+/g) ?? []).map(Number)
    const luminance = (r = 0, g = 0, b = 0) =>
      0.2126 * r + 0.7152 * g + 0.0722 * b
    const [r = 0, g = 0, b = 0] = channels(
      getComputedStyle(document.body).backgroundColor
    )
    const dialog = document.querySelector('dialog') ?? document.body
    const [sr = 0, sg = 0, sb = 0, alpha = 1] = channels(
      getComputedStyle(dialog, '::backdrop').backgroundColor
    )
    const over = (top: number, under: number) =>
      top * alpha + under * (1 - alpha)
    return {
      plain: luminance(r, g, b),
      dimmed: luminance(over(sr, r), over(sg, g), over(sb, b)),
    }
  })
  expect(dimmed).toBeLessThan(plain)
})

test('sidebar footer keeps links and the theme toggle on one line', async ({
  page,
}) => {
  test.skip(hasMenu(page), 'Only the persistent sidebar is checked here')
  await page.goto('/')
  const sidebar = page.getByRole('complementary', { name: 'Site' })
  const toggle = sidebar.getByRole('button', { name: 'Toggle dark theme' })
  const links = sidebar.locator('ul.whitespace-nowrap > li')

  const toggleBox = await toggle.boundingBox()
  expect(toggleBox).not.toBeNull()
  const count = await links.count()
  expect(count).toBeGreaterThan(0)

  for (let index = 0; index < count; index++) {
    const box = await links.nth(index).boundingBox()
    expect(box).not.toBeNull()
    if (!box || !toggleBox) continue
    // Same row as the toggle, and entirely to its left.
    expect(
      Math.abs(box.y + box.height / 2 - (toggleBox.y + toggleBox.height / 2))
    ).toBeLessThan(4)
    expect(box.x + box.width).toBeLessThanOrEqual(toggleBox.x)
  }
})
