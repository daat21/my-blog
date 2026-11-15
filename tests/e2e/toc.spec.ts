import { expect, test } from '@playwright/test'

const ARTICLE = '/writing/a-tour-of-the-content-format'

test('table of contents highlights the section being read', async ({
  page,
}) => {
  await page.goto(ARTICLE)
  const isRail = (page.viewportSize()?.width ?? 0) >= 1280
  if (!isRail) await page.locator('details summary').first().click()
  const current = page
    .getByRole('navigation', { name: 'On this page' })
    .locator('a[aria-current="location"]')

  await expect(current).toHaveCount(0)

  for (const [id, label] of [
    ['media', 'Media'],
    ['callouts', 'Callouts'],
  ] as const) {
    await page.evaluate(target => {
      document.getElementById(target)?.scrollIntoView()
    }, id)
    await expect(current).toHaveText(label)
  }
})
