import { CSP_HEADER_NAME } from '@/lib/security/csp'

import { expect, test } from './fixtures'

const EXPECTED_POLICY =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"

test('page responses enforce the content security policy', async ({ page }) => {
  for (const path of ['/', '/writing/keeping-a-work-log', '/not-a-page']) {
    const response = await page.goto(path)
    const headers = response?.headers() ?? {}
    expect(headers[CSP_HEADER_NAME.toLowerCase()], path).toBe(EXPECTED_POLICY)
    expect(headers['content-security-policy-report-only'], path).toBeUndefined()
  }
})

test('theme toggle and saved preference work under CSP', async ({
  page,
  colorScheme,
}) => {
  await page.goto('/')
  const html = page.locator('html')
  const initial = colorScheme === 'dark' ? 'dark' : 'light'
  const toggled = initial === 'light' ? 'dark' : 'light'
  await expect(html).toHaveAttribute('data-theme', initial)

  const menu = page.getByRole('button', { name: 'Open menu' })
  if (await menu.isVisible()) await menu.click()
  await page.getByRole('button', { name: 'Toggle dark theme' }).click()
  await expect(html).toHaveAttribute('data-theme', toggled)
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', toggled)
})
