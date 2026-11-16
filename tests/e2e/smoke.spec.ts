import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('home page renders cleanly and accessibly', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const overflowsHorizontally = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  )
  expect(overflowsHorizontally, 'page must not scroll horizontally').toBe(false)

  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(violations.map(v => `${v.id}: ${v.help}`)).toEqual([])

  expect(errors).toEqual([])
})
