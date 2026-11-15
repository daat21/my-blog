/**
 * Light-theme colours for generated images (Open Graph cards and icons).
 * They are rendered outside the page and cannot read the CSS variables, so
 * this mirrors the tokens in src/styles/globals.css; a test keeps them equal.
 */
export const ogPalette = {
  canvas: '#fbfaf8',
  border: '#e7e4de',
  fg: '#1b1a18',
  fgMuted: '#6b6862',
  accent: '#1d5c45',
} as const
