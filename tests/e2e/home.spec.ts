import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Expectations follow the fictional sample content in content-example/.

async function overflowsHorizontally(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  )
}

test.describe('home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('opens with the two-tone intro and a contact button', async ({
    page,
  }) => {
    const intro = page.getByRole('region', { name: /^Hi, I'm Avery/ })
    await expect(intro.getByRole('heading', { level: 1 })).toHaveText(
      "Hi, I'm Avery, a web developer in Exampleton. I build quiet, fast interfaces and write down what I learn along the way."
    )
    await expect(intro.getByText(/^For the past few years/)).toBeVisible()
    await expect(intro.getByText(/^This site is where/)).toBeVisible()

    await expect(
      intro.getByRole('link', { name: 'Get in touch' })
    ).toHaveAttribute('href', 'mailto:avery@example.com')
    // The sample profile has no résumé link, so there is no second button.
    await expect(intro.getByRole('link')).toHaveCount(1)
  })

  test('is described by the profile bio', async ({ page }) => {
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Avery builds small, fast websites and writes about the craft of the web.'
    )
  })

  test('lists the stack in groups', async ({ page }) => {
    const stack = page.getByRole('region', { name: 'Stack', exact: true })
    await expect(stack.getByRole('heading', { level: 3 })).toHaveText([
      'Languages',
      'Frameworks',
      'Tools',
    ])
    await expect(stack.getByText('TypeScript')).toBeVisible()
    await expect(stack.getByText('Playwright')).toBeVisible()
  })

  test('shows experience as a timeline', async ({ page }) => {
    const experience = page.getByRole('region', {
      name: 'Experience',
      exact: true,
    })
    const entries = experience.getByRole('listitem')
    await expect(entries).toHaveCount(3)
    await expect(entries.nth(0)).toContainText('2024-03 — Now')
    await expect(entries.nth(0)).toContainText(
      'Senior web developer · Example Studio'
    )
    await expect(entries.nth(2)).toContainText('2019 — 2021')
    await expect(entries.nth(2)).toContainText(
      'Junior developer · Placeholder Agency'
    )
  })

  test('shows up to four projects, featured first, linking out', async ({
    page,
  }) => {
    const projects = page.getByRole('region', { name: 'Projects', exact: true })
    await expect(projects.getByRole('heading', { level: 3 })).toHaveText([
      'Weather Glance',
      'Trail Journal',
      'Palette Picker',
      'Markdown Lint Action',
    ])

    // A card links to the live site, or to the repository without one.
    const links = {
      'Weather Glance': 'https://weather.example.com',
      'Trail Journal': 'https://code.example.com/avery/trail-journal',
      'Palette Picker': 'https://palette.example.com',
      'Markdown Lint Action':
        'https://code.example.com/avery/markdown-lint-action',
    }
    for (const [title, href] of Object.entries(links)) {
      await expect(
        projects.getByRole('link', { name: title, exact: true })
      ).toHaveAttribute('href', href)
    }

    const featured = projects.getByRole('article').filter({
      has: page.getByRole('heading', { name: 'Weather Glance' }),
    })
    await expect(featured).toContainText('in progress')
    await expect(featured.locator('picture source')).toHaveCount(2)
    await expect(featured.locator('img')).toBeVisible()
    // Only the featured sample project has a screenshot.
    await expect(projects.locator('img')).toHaveCount(1)
  })

  test('links to all projects', async ({ page }) => {
    await page
      .getByRole('region', { name: 'Projects', exact: true })
      .getByRole('link', { name: 'All projects' })
      .click()
    await expect(page).toHaveURL('/projects')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projects')
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
