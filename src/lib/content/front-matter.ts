import { parse as parseYaml } from 'yaml'

import { ContentError, messageOf } from '@/lib/content/content-error'

export interface FrontMatterDocument {
  /** The parsed YAML, not yet validated. */
  data: unknown
  /**
   * The Markdown after the front matter. The front matter is replaced by
   * blank lines, so line numbers in later errors match the file.
   */
  body: string
}

const FRONT_MATTER = /^---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/

/** Splits a Markdown file into its YAML front matter and its body. */
export function splitFrontMatter(
  source: string,
  file: string
): FrontMatterDocument {
  const text = source.replace(/^\uFEFF/, '')
  const match = FRONT_MATTER.exec(text)
  if (!match) {
    throw new ContentError(
      `${file}: Missing front matter; the file must start with a --- block`
    )
  }
  const block = match[0]
  return {
    data: parseYamlIn(match[1] ?? '', file) ?? {},
    body: '\n'.repeat(block.split('\n').length - 1) + text.slice(block.length),
  }
}

/** Parses a YAML document, naming the file if it is malformed. */
export function parseYamlIn(source: string, file: string): unknown {
  try {
    return parseYaml(source)
  } catch (error) {
    throw new ContentError(`${file}: Invalid YAML: ${messageOf(error)}`, {
      cause: error,
    })
  }
}
