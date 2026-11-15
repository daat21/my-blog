import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Expectations follow the fictional sample content in content-example/.

async function overflowsHorizontally(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  )
}

test.describe('projects page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects')
  })

  test('has a title, heading and description', async ({ page }) => {
    await expect(page).toHaveTitle(/Projects/)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /\S/
    )
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projects')
  })

  test('lists every project in source order', async ({ page }) => {
    const main = page.getByRole('main')
    await expect(main.getByRole('heading', { level: 2 })).toHaveText([
      'Weather Glance',
      'Trail Journal',
      'Palette Picker',
      'Markdown Lint Action',
    ])

    const card = (title: string) =>
      main.getByRole('article').filter({
        has: page.getByRole('heading', { name: title }),
      })
    await expect(card('Weather Glance')).toContainText('in progress')
    await expect(card('Weather Glance')).toContainText(
      'Next.js · TypeScript · Tailwind CSS'
    )
    await expect(card('Palette Picker')).toContainText('archived')
    // Without a status, the year takes its place.
    await expect(card('Trail Journal')).toContainText('2025')
  })

  test('links each card to its site or repository', async ({ page }) => {
    const main = page.getByRole('main')
    const links = {
      'Weather Glance': 'https://weather.example.com',
      'Trail Journal': 'https://code.example.com/avery/trail-journal',
      'Palette Picker': 'https://palette.example.com',
      'Markdown Lint Action':
        'https://code.example.com/avery/markdown-lint-action',
    }
    for (const [title, href] of Object.entries(links)) {
      await expect(
        main.getByRole('link', { name: title, exact: true })
      ).toHaveAttribute('href', href)
    }
  })

  test('renders cleanly and accessibly', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await page.reload()

    expect(
      await overflowsHorizontally(page),
      'page must not scroll horizontally'
    ).toBe(false)

    const { violations } = await new AxeBuilder({ page }).analyze()
    expect(violations.map(v => `${v.id}: ${v.help}`)).toEqual([])

    await page.setViewportSize({ width: 320, height: 640 })
    expect(
      await overflowsHorizontally(page),
      'page must not scroll horizontally at 320px'
    ).toBe(false)

    expect(errors).toEqual([])
  })
})
