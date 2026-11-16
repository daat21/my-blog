export type Theme = 'light' | 'dark'

/** localStorage key holding the visitor's explicit choice, if any. */
export const THEME_STORAGE_KEY = 'theme'

/**
 * Runs in <head> before first paint: applies the stored choice, or the system
 * preference, as `data-theme` on <html> so the page never flashes the wrong
 * theme. Kept tiny and dependency-free on purpose.
 */
export const THEME_INIT_SCRIPT = `(() => {
  try {
    const stored = localStorage.getItem('${THEME_STORAGE_KEY}')
    const theme = stored === 'light' || stored === 'dark'
      ? stored
      : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
  } catch {}
})()`
