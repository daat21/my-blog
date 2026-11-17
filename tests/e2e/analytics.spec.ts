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

test('same-origin analytics beacon is allowed by CSP', async ({ page }) => {
  // Probe connect-src without fetching the Vercel-hosted collector script.
  const endpoint = '/_vercel/insights/view'
  await page.route(`**${endpoint}`, route => route.fulfill({ status: 204 }))
  await page.goto('/')
  const beacon = page.waitForRequest(
    request =>
      new URL(request.url()).pathname === endpoint &&
      request.method() === 'POST'
  )
  expect(
    await page.evaluate(path => navigator.sendBeacon(path, '{}'), endpoint)
  ).toBe(true)
  await beacon
})
