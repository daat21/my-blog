import { expect, test } from './fixtures'

test('loads one analytics script across client navigation', async ({
  page,
}) => {
  await page.goto('/')
  const script = page.locator('script[src="/_vercel/insights/script.js"]')
  await expect(script).toHaveCount(1)
  await expect(script).toHaveAttribute('data-sdkn', '@vercel/analytics/next')

  await page.locator('main a[href="/projects"]').first().click()
  await expect(page).toHaveURL('/projects')
  await expect(script).toHaveCount(1)
})
