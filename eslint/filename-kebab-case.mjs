// @ts-check
import path from 'node:path'

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Requires kebab-case file names. `.test`/`.spec` and `.d.ts` suffixes are
 * ignored, so `post-card.test.ts` and `globals.d.ts` pass.
 * @type {import('eslint').Rule.RuleModule}
 */
export const filenameKebabCase = {
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
