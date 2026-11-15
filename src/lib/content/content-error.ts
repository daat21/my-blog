interface Positioned {
  position?: { start: { line: number; column: number } } | undefined
}

/**
 * A problem in a content file. The message always starts with the file path
 * relative to the content directory, so a failed build points at the file.
 */
export class ContentError extends Error {
  override name = 'ContentError'
}

/** Formats `file:line:column`, or just `file` when the node has no position. */
export function locate(file: string, node?: Positioned): string {
  const start = node?.position?.start
  return start ? `${file}:${start.line}:${start.column}` : file
}

/** Returns the message of an unknown thrown value. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
