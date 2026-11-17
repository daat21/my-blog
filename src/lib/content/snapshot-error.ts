export interface SnapshotIssue {
  code: string
  path?: string
  message: string
  ref?: string
}

const messages = {
  invalid_snapshot:
    'The content snapshot is malformed. Check the repository layout.',
  invalid_path:
    'Use a canonical repository-relative path without traversal or control characters.',
  unsupported_path:
    'is not a content file. Remove it, or move it out of writing/, photos/ and projects/.',
  unsupported_entry:
    'must be a regular file or directory, not a symlink or submodule.',
  duplicate_path:
    'appears more than once in the content tree. Remove the duplicate entry.',
  text_too_large: 'exceeds the 1 MiB text limit. Split or shorten the file.',
  too_many_files:
    'The snapshot exceeds the 10,000 text file limit. Reduce the number of content files.',
  text_budget_exceeded:
    'The snapshot exceeds the 16 MiB text budget. Reduce the content size.',
  response_too_large: 'The GitHub response exceeds the snapshot safety limit.',
  invalid_json: 'GitHub returned an invalid JSON envelope.',
  invalid_commit: 'GitHub returned an invalid commit envelope.',
  invalid_tree: 'GitHub returned an invalid tree envelope.',
  truncated_tree: 'GitHub returned an incomplete nonrecursive tree.',
  invalid_blob: 'has an invalid GitHub text blob envelope or base64 encoding.',
  blob_size_mismatch: 'has a GitHub blob size mismatch.',
  invalid_utf8: 'is not valid UTF-8. Save the file as UTF-8.',
  missing_profile: 'is missing. Add the required profile file.',
  validation_failed:
    'failed content validation. Check its front matter, Markdown and media references.',
} as const
export type SnapshotReason = keyof typeof messages

/** Creates a bounded diagnostic without copying content, upstream errors or credentials. */
export function snapshotIssue(
  code: SnapshotReason,
  path?: string
): SnapshotIssue {
  return {
    code,
    ...(path && { path }),
    message: path ? `${path} ${messages[code]}` : messages[code],
  }
}

/** A rejected snapshot, with safe owner-facing diagnostics shared by build and runtime. */
export class InvalidSnapshot extends Error {
  readonly issues: SnapshotIssue[]
  constructor(code: SnapshotReason = 'invalid_snapshot', path?: string) {
    const issue = snapshotIssue(code, path)
    super(issue.message)
    this.issues = [issue]
  }
}
