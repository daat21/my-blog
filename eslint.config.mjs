// @ts-check
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import js from '@eslint/js'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

import { architecture } from './eslint/architecture.mjs'

export default defineConfig([
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
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

  // Naming, exports, environment access, design tokens, module boundaries.
  ...architecture,
])
