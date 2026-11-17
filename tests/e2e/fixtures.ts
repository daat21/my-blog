import { expect, test as base } from '@playwright/test'

export { expect } from '@playwright/test'
export type { Page, TestInfo } from '@playwright/test'

export const test = base.extend<{ cspGuard: undefined }>({
  cspGuard: [
    async ({ context }, runTest) => {
      const violations: string[] = []
      // Keep violations outside the document so full navigations cannot erase them.
      await context.exposeBinding(
        '__recordCspViolation',
        ({ frame }, violation: string) => {
          violations.push(`${frame.url()}: ${violation}`)
        }
      )
      await context.addInitScript(() => {
        const target = window as typeof window & {
          __recordCspViolation: (violation: string) => Promise<void>
        }
        document.addEventListener('securitypolicyviolation', event => {
          void target.__recordCspViolation(
            `${event.disposition}: ${event.effectiveDirective} blocked ${event.blockedURI}`
          )
        })
      })
      context.on('page', page => {
        page.on('console', message => {
          if (
            message.type() === 'error' &&
            /content[ -]security[ -]policy|\bcsp\b/i.test(message.text())
          )
            violations.push(`${page.url()}: ${message.text()}`)
        })
      })
      await runTest(undefined)
      // Drain queued violation events before asserting.
      for (const page of context.pages()) {
        if (!page.isClosed())
          await page.evaluate(
            () => new Promise<void>(resolve => setTimeout(resolve, 0))
          )
      }
      expect(violations, 'No CSP violations on any visited page').toEqual([])
    },
    { auto: true },
  ],
  page: async ({ page }, runTest) => {
    // This endpoint exists on Vercel, not in next start. Keep tests offline
    // without hiding console errors or changing production analytics.
    await page.route('**/_vercel/insights/script.js', route =>
      route.fulfill({ contentType: 'application/javascript', body: '' })
    )
    await runTest(page)
  },
})
