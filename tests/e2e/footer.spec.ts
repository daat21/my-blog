import { expect, test } from './fixtures'

for (const path of ['/tags/habits', '/missing-page']) {
  test(`footer reaches the bottom of a short page: ${path}`, async ({
    page,
  }) => {
    await page.goto(path)
    await page.evaluate(() => document.fonts.ready)
    const geometry = await page.locator('main footer').evaluate(footer => {
      const box = footer.getBoundingClientRect()
      return {
        bottom: box.bottom + window.scrollY,
        viewport: window.innerHeight,
        page: document.documentElement.scrollHeight,
      }
    })
    // The existing 10-unit bottom gutter is retained.
    expect(geometry.bottom).toBeCloseTo(geometry.viewport - 40, 0)
    expect(geometry.page).toBe(geometry.viewport)
  })
}

for (const path of [
  '/',
  '/writing',
  '/writing/a-tour-of-the-content-format',
  '/projects',
  '/photos',
  '/photos/coastal-light',
  '/photos/coastal-light/low-sun',
]) {
  test(`footer follows content without overlap: ${path}`, async ({ page }) => {
    await page.goto(path)
    await page.evaluate(() => document.fonts.ready)
    const geometry = await page
      .locator('main footer')
      .last()
      .evaluate(footer => {
        const wrapper = footer.parentElement
        const content = wrapper?.previousElementSibling
        if (!content) throw new Error('Footer must follow page content')
        return {
          gap:
            footer.getBoundingClientRect().top -
            content.getBoundingClientRect().bottom,
          bottom: footer.getBoundingClientRect().bottom + window.scrollY,
          page: document.documentElement.scrollHeight,
          viewport: window.innerHeight,
        }
      })
    expect(geometry.gap).toBeGreaterThanOrEqual(79)
    expect(geometry.bottom).toBeGreaterThanOrEqual(geometry.viewport - 41)
    expect(geometry.page - geometry.bottom).toBeCloseTo(40, 0)
    if (path === '/writing/a-tour-of-the-content-format') {
      expect(geometry.bottom).toBeGreaterThan(geometry.viewport)
      expect(geometry.gap).toBeCloseTo(80, 0)
    }
  })
}
