import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { CopyButton } from './copy-button'

interface CodeBlockProps {
  /**
   * The `<code>` element. Each line is a `.line` element, and lines are
   * separated by newlines, as syntax highlighters such as Shiki emit them.
   */
  children: ReactNode
  /** The plain source, for the copy button. */
  code: string
  /** A file name, shown in a header above the code. */
  title?: string
  /** The highlighter's classes and custom properties for the `<pre>`. */
  preClassName?: string
  preStyle?: CSSProperties
  className?: string
}

// Line numbers come from a CSS counter, so they are never selected or
// copied with the code, and the empty alternative text keeps screen readers
// from reading them out.
const LINE_NUMBERS =
  "[counter-reset:line] [&_.line]:[counter-increment:line] [&_.line]:before:mr-[2ch] [&_.line]:before:inline-block [&_.line]:before:w-[3ch] [&_.line]:before:text-right [&_.line]:before:text-fg-muted [&_.line]:before:content-[counter(line)_/_'']"

/**
 * A code block: a file-name header when titled, line numbers and a copy
 * button. Long lines scroll inside the block, never the page; the block
 * takes keyboard focus so it can be scrolled without a pointer.
 */
export function CodeBlock({
  children,
  code,
  title,
  preClassName,
  preStyle,
  className,
}: CodeBlockProps) {
  const pre = (
    <pre
      // Focusable so keyboard users can scroll long lines.
      tabIndex={0}
      style={preStyle}
      className={cn(
        preClassName,
        'overflow-x-auto pt-3.5 pr-5 pb-4 pl-3 font-mono text-sm/6',
        !title && 'pr-14',
        LINE_NUMBERS
      )}
    >
      {children}
    </pre>
  )

  const frame =
    'relative my-6 overflow-hidden rounded-md border border-border bg-code'

  if (title) {
    return (
      <figure className={cn(frame, className)}>
        <figcaption className="flex h-11.5 items-center border-b border-border bg-sunken pr-12 pl-4 font-mono text-meta text-fg-muted">
          <span className="truncate">{title}</span>
        </figcaption>
        <CopyButton text={code} className="absolute top-0.25 right-0.5" />
        {pre}
      </figure>
    )
  }

  return (
    <div className={cn(frame, className)}>
      <CopyButton text={code} className="absolute top-1 right-1 bg-code" />
      {pre}
    </div>
  )
}
