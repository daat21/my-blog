// @ts-check
import { filenameKebabCase } from './filename-kebab-case.mjs'

// ---------------------------------------------------------------------------
// Module boundaries
// ---------------------------------------------------------------------------

/** @typedef {{ group: string[], message: string }} ImportPattern */

/** @type {ImportPattern[]} */
const BASE_IMPORT_PATTERNS = [
  {
    group: ['../../*'],
    message:
      'Use the @/ alias instead of relative paths that climb more than one level.',
  },
  {
    group: ['@/features/*/**'],
    message:
      'Import a feature only through its public entry (@/features/<name>). Inside a feature, use relative imports.',
  },
]

/** @type {ImportPattern} */
const NO_APP = {
  group: ['@/app', '@/app/**'],
  message: 'app/ holds routes only; nothing imports from it.',
}
/** @type {ImportPattern} */
const NO_FEATURES = {
  group: ['@/features', '@/features/**'],
  message: 'This layer must not depend on features.',
}
/** @type {ImportPattern} */
const NO_COMPONENTS = {
  group: ['@/components', '@/components/**'],
  message: 'lib/ must not depend on components.',
}
/** @type {ImportPattern} */
const NO_LAYOUT = {
  group: ['@/components/layout', '@/components/layout/**'],
  message: 'UI primitives must not depend on layout components.',
}
/** @type {ImportPattern} */
const ONLY_LIB_UTILS = {
  group: ['@/lib/*', '!@/lib/utils'],
  message: 'UI primitives may only use @/lib/utils from lib/.',
}

/**
 * Restricts imports for one architecture layer. Flat config replaces a rule's
 * options per file instead of merging them, so every layer repeats the base
 * patterns.
 * @param {string[]} files
 * @param {ImportPattern[]} patterns
 * @returns {import('eslint').Linter.Config}
 */
const layer = (files, patterns) => ({
  files,
  rules: {
    'no-restricted-imports': [
      'error',
      { patterns: [...BASE_IMPORT_PATTERNS, ...patterns] },
    ],
  },
})

// ---------------------------------------------------------------------------
// Design tokens only: no raw colours, no default Tailwind palette
// ---------------------------------------------------------------------------

const RAW_COLOR = String.raw`^#[0-9a-fA-F]{3,8}$|\[#[0-9a-fA-F]{3,8}\]|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\(`
const DEFAULT_PALETTE = String.raw`\b(?:bg|text|border(?:-[trblxyse])?|ring|ring-offset|outline|decoration|divide|placeholder|caret|accent|fill|stroke|shadow|inset-shadow|drop-shadow|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)\b`
const COLOR_MESSAGE =
  'Use design tokens (for example bg-surface or text-fg-muted) instead of raw colours or the default Tailwind palette.'

const SOURCE = ['src/**/*.{ts,tsx}']

/**
 * Project-specific rules for source files: naming, exports, environment
 * access, design tokens and module boundaries. Unit-tested in
 * architecture.test.ts.
 * @type {import('eslint').Linter.Config[]}
 */
export const architecture = [
  {
    files: SOURCE,
    plugins: { local: { rules: { 'filename-kebab-case': filenameKebabCase } } },
    rules: {
      'local/filename-kebab-case': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: `Literal[value=/${RAW_COLOR}/]`, message: COLOR_MESSAGE },
        {
          selector: `TemplateElement[value.raw=/${RAW_COLOR}/]`,
          message: COLOR_MESSAGE,
        },
        {
          selector: `Literal[value=/${DEFAULT_PALETTE}/]`,
          message: COLOR_MESSAGE,
        },
        {
          selector: `TemplateElement[value.raw=/${DEFAULT_PALETTE}/]`,
          message: COLOR_MESSAGE,
        },
      ],
    },
  },
  {
    files: SOURCE,
    ignores: ['src/lib/env.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Read environment variables through @/lib/env.',
        },
      ],
    },
  },
  {
    files: SOURCE,
    ignores: ['src/app/**'],
    rules: {
      'no-restricted-exports': [
        'error',
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
    },
  },

  // Module boundaries: the general rule first, then each layer narrows it.
  layer(SOURCE, [NO_APP]),
  layer(['src/components/layout/**/*.{ts,tsx}'], [NO_APP, NO_FEATURES]),
  layer(
    ['src/components/ui/**/*.{ts,tsx}'],
    [NO_APP, NO_FEATURES, NO_LAYOUT, ONLY_LIB_UTILS]
  ),
  layer(['src/lib/**/*.{ts,tsx}'], [NO_APP, NO_FEATURES, NO_COMPONENTS]),
]
