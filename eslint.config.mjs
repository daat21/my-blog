// @ts-check
import path from 'node:path'

import comments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import js from '@eslint/js'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

// ---------------------------------------------------------------------------
// Local rules
// ---------------------------------------------------------------------------

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** @type {import('eslint').Rule.RuleModule} */
const filenameKebabCase = {
  meta: {
    type: 'suggestion',
    docs: { description: 'Require kebab-case file names' },
    schema: [],
    messages: {
      kebab: "File name '{{name}}' must be kebab-case, e.g. post-card.tsx.",
    },
  },
  create(context) {
    return {
      Program(node) {
        const name = path.basename(context.filename)
        const stem = name
          .replace(/\.d\.ts$/, '')
          .replace(/\.(test|spec)(?=\.[^.]+$)/, '')
          .replace(/\.[^.]+$/, '')
        if (!KEBAB_CASE.test(stem)) {
          context.report({ node, messageId: 'kebab', data: { name } })
        }
      },
    }
  },
}

const localPlugin = { rules: { 'filename-kebab-case': filenameKebabCase } }

// ---------------------------------------------------------------------------
// Architecture: module boundaries
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

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export default defineConfig([
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
  ]),

  js.configs.recommended,
  ...nextVitals,
  ...nextTs,
  comments.recommended,

  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      '@eslint-community/eslint-comments/require-description': 'error',
      'react/no-danger': 'error',
    },
  },

  // TypeScript: strict, type-aware rules.
  {
    files: ['**/*.{ts,tsx,mts}'],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
    },
  },

  // Source files: naming, exports, environment access, colours.
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { local: localPlugin },
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
    files: ['src/**/*.{ts,tsx}'],
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
    files: ['src/**/*.{ts,tsx}'],
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

  // Module boundaries: general rule first, then each layer narrows it.
  layer(['src/**/*.{ts,tsx}'], [NO_APP]),
  layer(['src/components/layout/**/*.{ts,tsx}'], [NO_APP, NO_FEATURES]),
  layer(
    ['src/components/ui/**/*.{ts,tsx}'],
    [NO_APP, NO_FEATURES, NO_LAYOUT, ONLY_LIB_UTILS]
  ),
  layer(['src/lib/**/*.{ts,tsx}'], [NO_APP, NO_FEATURES, NO_COMPONENTS]),
])
