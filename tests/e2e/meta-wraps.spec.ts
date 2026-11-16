import { expect, test } from '@playwright/test'

for (const path of [
  '/',
  '/projects',
  '/photos',
  '/photos/coastal-light',
  '/writing',
  '/writing/a-tour-of-the-content-format',
  '/tags/design',
]) {
  test(`meta separators stay with the preceding item on ${path}`, async ({
    page,
    viewport,
  }) => {
    await page.goto(path)
    await page.evaluate(() => document.fonts.ready)

    const ungroupedDots = await page
      .locator(
        'main p.font-mono, main header .font-mono, main section > div > span.font-mono, aside p'
      )
      .evaluateAll(lines =>
        lines.flatMap(line => {
          const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT)
          const ungrouped: string[] = []
          while (walker.nextNode()) {
            const node = walker.currentNode
            if (
              node.textContent?.includes('·') &&
              !node.parentElement?.closest('[data-separator]')
            ) {
              ungrouped.push(node.textContent)
            }
          }
          return ungrouped
        })
      )
    expect(
      ungroupedDots,
      'every meta dot must use the shared wrap-safe group'
    ).toEqual([])

    if (path === '/projects' && viewport?.width === 390) {
      const stack = page
        .locator('article')
        .first()
        .locator('[data-separated-item]')
      const tops = await stack.evaluateAll(items =>
        items.map(item => item.getBoundingClientRect().top)
      )
      expect(
        new Set(tops).size,
        'the regression stack must actually wrap at 390px'
      ).toBeGreaterThan(1)
    }

    const violations = await page
      .locator('[data-separated-item]')
      .evaluateAll(items =>
        items.flatMap(item => {
          const value = item.querySelector('[data-separated-value]')
          const separator = item.querySelector('[data-separator]')
          if (!value || !separator) return []
          const valueRects = [...value.getClientRects()]
          const separatorRects = [...separator.getClientRects()]
          // Hidden sidebar copies have no line boxes on compact screens.
          if (separatorRects.length === 0) return []
          const sameLine = separatorRects.every(dot =>
            valueRects.some(
              rect =>
                rect.width > 0 &&
                dot.left >= rect.right - 1 &&
                dot.top < rect.bottom &&
                dot.bottom > rect.top
            )
          )
          return sameLine ? [] : [item.textContent]
        })
      )
    expect(violations, 'no line box may begin with a separator').toEqual([])

    const spacingViolations = await page
      .locator('[data-separator]')
      .evaluateAll(separators =>
        separators.flatMap(separator => {
          const item = separator.closest('[data-separated-item]')
          const value = item?.querySelector('[data-separated-value]')
          if (!item || !value || separator.getClientRects().length === 0)
            return []

          // Measure a normal space in the same font, independently of list layout.
          const probe = document.createElement('span')
          probe.textContent = ' '
          probe.style.whiteSpace = 'pre'
          probe.style.position = 'absolute'
          item.append(probe)
          const spaceWidth = probe.getBoundingClientRect().width
          probe.remove()

          const dot = separator.getBoundingClientRect()
          const before = value.getBoundingClientRect()
          const gaps = [dot.left - before.right]
          const list = item.closest('[data-separated-list]')
          const next =
            item.nextElementSibling?.querySelector('[data-separated-value]') ??
            list?.nextElementSibling
          if (next) {
            const after = next.getBoundingClientRect()
            if (dot.top < after.bottom && dot.bottom > after.top) {
              gaps.push(after.left - dot.right)
            }
          }
          return gaps.every(gap => Math.abs(gap - spaceWidth) <= 0.25)
            ? []
            : [{ text: item.textContent, spaceWidth, gaps }]
        })
      )
    expect(
      spacingViolations,
      'separators have exactly one normal space on each side'
    ).toEqual([])
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth
      )
    ).toBe(false)
  })
}

test('experience roles wrap only between complete arrow steps', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const experience = page.getByRole('region', {
    name: 'Experience',
    exact: true,
  })
  const role = experience.getByText('Developer and Reviewer', { exact: true })
  const step = experience.getByText('Lead reviewer (Jul)', { exact: true })
  for (const item of [role, step]) {
    await expect(item).toBeVisible()
    expect(
      await item.evaluate(element => {
        const range = document.createRange()
        range.selectNodeContents(element)
        return range.getClientRects().length
      })
    ).toBe(1)
  }
  const title = experience.getByText('Sample publishing tools', { exact: true })
  const titleBox = await title.boundingBox()
  const roleBox = await role.boundingBox()
  expect(titleBox).not.toBeNull()
  expect(roleBox).not.toBeNull()
  if (titleBox && roleBox)
    expect(roleBox.y).toBeGreaterThanOrEqual(titleBox.y + titleBox.height)
})
