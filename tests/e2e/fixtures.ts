import { test as base } from '@playwright/test'

export { expect } from '@playwright/test'
export type { Page, TestInfo } from '@playwright/test'

export const test = base.extend({
  page: async ({ page }, runTest) => {
    // This endpoint exists on Vercel, not in next start. Keep tests offline
    // without hiding console errors or changing production analytics.
    await page.route('**/_vercel/insights/script.js', route =>
      route.fulfill({ contentType: 'application/javascript', body: '' })
    )
    await runTest(page)
  },
})
