import { ESLint } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'

import { architecture } from './architecture.mjs'

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [
    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
    },
    ...architecture,
  ],
})

/**
 * Lints `code` as if it lived at `filePath` and returns the rule IDs hit.
 * Throws on parse errors so an "allows …" case can never pass vacuously.
 */
async function violations(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath })
  const messages = result?.messages ?? []
  const fatal = messages.find(message => message.fatal)
  if (fatal) throw new Error(`Parse error in fixture: ${fatal.message}`)
  return messages.map(message => message.ruleId ?? 'unknown')
}

const IMPORTS = 'no-restricted-imports'

describe('module boundaries', () => {
  it.each([
    ['ui → features', 'src/components/ui/a.tsx', '@/features/posts'],
    ['ui → layout', 'src/components/ui/a.tsx', '@/components/layout/sidebar'],
    ['ui → lib/content', 'src/components/ui/a.tsx', '@/lib/content/source'],
    ['layout → features', 'src/components/layout/a.tsx', '@/features/posts'],
    ['lib → components', 'src/lib/content/a.ts', '@/components/ui/button'],
    ['lib → features', 'src/lib/media/a.ts', '@/features/posts'],
    ['anything → app', 'src/features/posts/a.ts', '@/app/layout'],
    ['app → feature internals', 'src/app/page.tsx', '@/features/posts/list'],
    ['deep relative path', 'src/features/posts/a/b.ts', '../../c'],
  ])('rejects %s', async (_, filePath, source) => {
    expect(await violations(filePath, `import '${source}'\n`)).toContain(
      IMPORTS
    )
  })

  it.each([
    ['ui → lib/utils', 'src/components/ui/a.tsx', '@/lib/utils'],
    ['ui → lib/utils module', 'src/components/ui/a.tsx', '@/lib/utils/cn'],
    ['ui → ui', 'src/components/ui/a.tsx', '@/components/ui/button'],
    ['layout → ui', 'src/components/layout/a.tsx', '@/components/ui/button'],
    ['app → feature entry', 'src/app/page.tsx', '@/features/posts'],
    ['feature → lib', 'src/features/posts/a.ts', '@/lib/content'],
    ['one-level relative path', 'src/features/posts/a/b.ts', '../c'],
  ])('allows %s', async (_, filePath, source) => {
    expect(await violations(filePath, `import '${source}'\n`)).not.toContain(
      IMPORTS
    )
  })
})

describe('design tokens only', () => {
  const RULE = 'no-restricted-syntax'

  it.each([
    ['default palette class', `const c = 'flex bg-gray-100'`],
    ['default palette in a template', 'const c = `text-white ${x}`'],
    ['arbitrary hex class', `const c = 'text-[#ff0000]'`],
    ['hex string', `const style = { color: '#fff' }`],
    ['colour function', `const style = { color: 'rgb(0 0 0)' }`],
  ])('rejects a %s', async (_, code) => {
    expect(await violations('src/components/ui/a.tsx', code)).toContain(RULE)
  })

  it.each([
    ['token classes', `const c = 'bg-surface text-fg-muted border-border'`],
    ['accent token', `const c = 'bg-accent-tint text-accent'`],
    ['fragment link', `const href = '#top'`],
  ])('allows %s', async (_, code) => {
    expect(await violations('src/components/ui/a.tsx', code)).not.toContain(
      RULE
    )
  })

  describe('in generated images', () => {
    const rawColors = `const a = '#fbfaf8'\nconst b = \`rgb(0 0 0 / \${x})\`\n`

    it.each([
      'src/app/opengraph-image.tsx',
      'src/app/(site)/writing/[slug]/opengraph-image.tsx',
      'src/app/icon.tsx',
      'src/app/apple-icon.tsx',
      'src/app/(site)/projects/icon.tsx',
      'src/lib/og/palette.ts',
    ])('allows raw colours in %s', async filePath => {
      expect(await violations(filePath, rawColors)).not.toContain(RULE)
    })

    it.each([
      'src/app/page.tsx',
      'src/app/layout.tsx',
      'src/app/not-found.tsx',
      'src/app/(site)/writing/[slug]/page.tsx',
      'src/app/opengraph-image-card.tsx',
      'src/components/ui/icon.tsx',
      'src/lib/og/card.tsx',
      'src/lib/palette.ts',
    ])('still rejects raw colours in %s', async filePath => {
      expect(await violations(filePath, rawColors)).toContain(RULE)
    })

    it('still rejects the default palette', async () => {
      expect(
        await violations('src/app/icon.tsx', `const c = 'bg-gray-100'`)
      ).toContain(RULE)
    })
  })
})

describe('environment access', () => {
  const RULE = 'no-restricted-properties'
  const code = 'export const url = process.env.SITE_URL\n'

  it('rejects process.env outside src/lib/env.ts', async () => {
    expect(await violations('src/lib/content/a.ts', code)).toContain(RULE)
  })

  it('allows process.env in src/lib/env.ts', async () => {
    expect(await violations('src/lib/env.ts', code)).not.toContain(RULE)
  })
})

describe('named exports only', () => {
  const RULE = 'no-restricted-exports'
  const code = 'export default function Thing() {\n  return null\n}\n'

  it('rejects default exports outside src/app', async () => {
    expect(await violations('src/components/ui/thing.tsx', code)).toContain(
      RULE
    )
  })

  it('allows default exports in src/app', async () => {
    expect(await violations('src/app/page.tsx', code)).not.toContain(RULE)
  })
})

describe('kebab-case file names', () => {
  const RULE = 'local/filename-kebab-case'

  it.each(['PostCard.tsx', 'post_card.ts', 'postCard.ts'])(
    'rejects %s',
    async name => {
      expect(await violations(`src/lib/${name}`, '')).toContain(RULE)
    }
  )

  it.each(['post-card.tsx', 'post-card.test.ts', 'globals.d.ts', 'index.ts'])(
    'allows %s',
    async name => {
      expect(await violations(`src/lib/${name}`, '')).not.toContain(RULE)
    }
  )
})
