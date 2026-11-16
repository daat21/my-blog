import { defineConfig } from '@playwright/test'

/** Override with E2E_PORT to run several suites side by side. */
const PORT = Number(process.env.E2E_PORT ?? 3000)
const isCI = Boolean(process.env.CI)

/** The four reference viewports every page is checked at. */
const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844, touch: true },
  { name: 'ipad-portrait', width: 820, height: 1180, touch: true },
  { name: 'ipad-landscape', width: 1180, height: 820, touch: true },
  { name: 'desktop', width: 1440, height: 900, touch: false },
] as const

const COLOR_SCHEMES = ['light', 'dark'] as const

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    ...VIEWPORTS.flatMap(viewport =>
      COLOR_SCHEMES.map(colorScheme => ({
        name: `${viewport.name}-${colorScheme}`,
        use: {
          browserName: 'chromium' as const,
          viewport: { width: viewport.width, height: viewport.height },
          isMobile: viewport.touch,
          hasTouch: viewport.touch,
          colorScheme,
        },
      }))
    ),
    // Engine spot checks catch differences such as dialog exit transitions.
    // Representative combinations keep them fast.
    {
      name: 'firefox-phone-light',
      use: {
        browserName: 'firefox' as const,
        viewport: { width: 390, height: 844 },
        colorScheme: 'light' as const,
      },
    },
    {
      name: 'firefox-desktop-dark',
      use: {
        browserName: 'firefox' as const,
        viewport: { width: 1440, height: 900 },
        colorScheme: 'dark' as const,
      },
    },
    // WebKit's Linux system libraries are available on CI, not every workstation.
    ...(isCI
      ? [
          {
            name: 'webkit-phone-light',
            use: {
              browserName: 'webkit' as const,
              viewport: { width: 390, height: 844 },
              isMobile: true,
              hasTouch: true,
              colorScheme: 'light' as const,
            },
          },
          {
            name: 'webkit-ipad-portrait-dark',
            use: {
              browserName: 'webkit' as const,
              viewport: { width: 820, height: 1180 },
              isMobile: true,
              hasTouch: true,
              colorScheme: 'dark' as const,
            },
          },
        ]
      : []),
  ],
  webServer: {
    // CI builds in an earlier step; locally, build first so the test runs
    // against production output.
    command: isCI
      ? `pnpm start --port ${PORT}`
      : `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
})
