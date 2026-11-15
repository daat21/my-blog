import type { Element, ElementContent, Root } from 'hast'
import {
  toJsxRuntime,
  type Components,
  type ExtraProps,
} from 'hast-util-to-jsx-runtime'
import type { ComponentProps, JSX, ReactNode } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'

import { Callout } from '@/components/ui/callout'
import { CodeBlock } from '@/components/ui/code-block'
import { Figure } from '@/components/ui/figure'
import { Video, type VideoSource } from '@/components/ui/video'
import { cn } from '@/lib/utils'

import { isExternalHref } from './external-href'
import { numberFigures } from './figure-numbers'
import { childElement, isElement, stringProperty, textOf } from './hast'

type Props<Tag extends keyof JSX.IntrinsicElements> = ComponentProps<Tag> &
  ExtraProps

/** The reading column is at most 690px wide from the medium tier up. */
const IMAGE_SIZES = '(min-width: 768px) 690px, 100vw'

/** Headings clear the sticky top bar below the wide tier. */
const HEADING_SCROLL_MARGIN = 'scroll-mt-20 lg:scroll-mt-8'

function render(
  node: Root | Element | ElementContent[],
  components?: Partial<Components>
): ReactNode {
  const tree: Root | Element = Array.isArray(node)
    ? { type: 'root', children: node }
    : node
  return toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    components,
    passNode: components !== undefined,
  }) as ReactNode
}

/** Props for the DOM element, without the hast node. */
function withoutNode<P extends ExtraProps>({ ...props }: P): Omit<P, 'node'> {
  delete props.node
  return props
}

function hasClass(className: string | undefined, name: string): boolean {
  return className?.split(' ').includes(name) ?? false
}

function numberProperty(node: Element, name: string): number | undefined {
  const value = node.properties[name]
  return typeof value === 'number' ? value : undefined
}

function videoSources(video: Element): VideoSource[] {
  return video.children.flatMap(child => {
    if (!isElement(child, 'source')) return []
    const src = stringProperty(child, 'src')
    const type = stringProperty(child, 'type')
    return src && type ? [{ src, type }] : []
  })
}

function createComponents(root: Root): Partial<Components> {
  const figureNumbers = numberFigures(root)

  /** A `<pre>` from the highlighter, as a code block with an optional title. */
  function codeBlock(title?: string) {
    return function Pre({ node, className, style }: Props<'pre'>) {
      if (!node) return null
      return (
        <CodeBlock
          title={title}
          code={textOf(node)}
          preClassName={className}
          preStyle={style}
        >
          {/* Rendered without the article components: inside a code block,
              `code` is not inline code. */}
          {render(node.children)}
        </CodeBlock>
      )
    }
  }

  const components: Partial<Components> = {
    h2: ({ children, ...props }: Props<'h2'>) => (
      <h2
        {...withoutNode(props)}
        className={cn(
          'mt-12 mb-3.5 flex items-baseline gap-2.5 text-h2 font-semibold tracking-[-0.012em] text-fg',
          HEADING_SCROLL_MARGIN,
          props.className
        )}
      >
        <span
          aria-hidden="true"
          className="font-mono text-ui font-normal text-fg-muted"
        >
          ##
        </span>
        <span className="min-w-0">{children}</span>
      </h2>
    ),
    h3: (props: Props<'h3'>) => (
      <h3
        {...withoutNode(props)}
        className={cn(
          'mt-9 mb-3 text-section font-semibold tracking-[-0.01em] text-fg',
          HEADING_SCROLL_MARGIN,
          props.className
        )}
      />
    ),
    h4: (props: Props<'h4'>) => (
      <h4
        {...withoutNode(props)}
        className={cn(
          'mt-8 mb-2 font-semibold text-fg',
          HEADING_SCROLL_MARGIN,
          props.className
        )}
      />
    ),
    p: (props: Props<'p'>) => (
      <p {...withoutNode(props)} className={cn('mb-5', props.className)} />
    ),
    a: (props: Props<'a'>) => (
      <a
        {...withoutNode(props)}
        rel={
          props.href && isExternalHref(props.href)
            ? 'noopener noreferrer'
            : undefined
        }
        className={cn(
          'text-accent underline decoration-1 underline-offset-3 transition-colors duration-150 hover:decoration-2',
          props.className
        )}
      />
    ),
    strong: (props: Props<'strong'>) => (
      <strong
        {...withoutNode(props)}
        className={cn('font-semibold text-fg', props.className)}
      />
    ),
    // Inline code only: code blocks render their `code` themselves.
    code: (props: Props<'code'>) => (
      <code
        {...withoutNode(props)}
        className={cn(
          'rounded border border-border bg-sunken px-1.5 py-px font-mono text-[0.84em] text-fg',
          props.className
        )}
      />
    ),
    blockquote: (props: Props<'blockquote'>) => (
      <blockquote
        {...withoutNode(props)}
        className={cn(
          'my-6 border-l-2 border-border-strong pl-5 [&>*]:mb-0 [&>*+*]:mt-3',
          props.className
        )}
      />
    ),
    ul: (props: Props<'ul'>) => (
      <ul
        {...withoutNode(props)}
        className={cn(
          'mb-6 space-y-2.5 [&_ul]:mt-2.5 [&_ul]:mb-0',
          hasClass(props.className, 'contains-task-list')
            ? 'list-none'
            : 'list-disc pl-6 marker:text-fg-muted',
          props.className
        )}
      />
    ),
    li: (props: Props<'li'>) => (
      <li
        {...withoutNode(props)}
        className={cn('[&>p]:mb-2.5 [&>p:last-child]:mb-0', props.className)}
      />
    ),
    // Each item gets a mono, zero-padded number in a column of its own; the
    // list's own numbering stays for assistive technology.
    ol: ({ node, start, className }: Props<'ol'>) => {
      if (!node) return null
      const first = start ?? 1
      const items = node.children.filter(child => isElement(child, 'li'))
      return (
        <ol
          start={start}
          className={cn('mb-6 flex list-none flex-col gap-2.5', className)}
        >
          {items.map((item, index) => (
            <li key={index} className="flex gap-3.5">
              <span
                aria-hidden="true"
                className="shrink-0 pt-1 font-mono text-meta text-accent"
              >
                {String(first + index).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1 [&>*]:mb-0 [&>*+*]:mt-2.5">
                {render(item.children, components)}
              </div>
            </li>
          ))}
        </ol>
      )
    },
    // Task list checkboxes are read-only marks. Their state is spelled out
    // for screen readers instead, so they need no label of their own.
    input: (props: Props<'input'>) =>
      props.type === 'checkbox' ? (
        <>
          <input
            {...withoutNode(props)}
            aria-hidden="true"
            className={cn(
              'mr-2.5 inline-block size-4 align-[-0.125em] accent-accent',
              props.className
            )}
          />
          <span className="sr-only">
            {props.checked ? 'Done: ' : 'To do: '}
          </span>
        </>
      ) : (
        <input {...withoutNode(props)} />
      ),
    hr: (props: Props<'hr'>) => (
      <hr
        {...withoutNode(props)}
        className={cn('my-12 border-border', props.className)}
      />
    ),
    table: (props: Props<'table'>) => (
      // Wide tables scroll inside this box, which takes focus so they can be
      // scrolled with the keyboard.
      <div tabIndex={0} className="my-6 overflow-x-auto">
        <table
          {...withoutNode(props)}
          className={cn(
            'w-full border-collapse text-left text-sm [&_td:first-child]:pl-0 [&_th:first-child]:pl-0',
            props.className
          )}
        />
      </div>
    ),
    th: (props: Props<'th'>) => (
      <th
        {...withoutNode(props)}
        className={cn(
          'border-b border-border-strong px-3 py-2 align-bottom font-semibold text-fg',
          props.className
        )}
      />
    ),
    td: (props: Props<'td'>) => (
      <td
        {...withoutNode(props)}
        className={cn(
          'border-b border-border px-3 py-2 align-top',
          props.className
        )}
      />
    ),
    img: (props: Props<'img'>) => (
      // The media pipeline has already made AVIF and WebP variants at several
      // widths; `sizes` lets the browser pick one for the reading column.
      // eslint-disable-next-line @next/next/no-img-element -- Images are optimised at build time, not by next/image.
      <img
        {...withoutNode(props)}
        alt={props.alt}
        sizes={IMAGE_SIZES}
        className={cn('block h-auto w-full', props.className)}
      />
    ),
    source: (props: Props<'source'>) => (
      <source
        {...withoutNode(props)}
        sizes={props.srcSet ? IMAGE_SIZES : undefined}
      />
    ),
    pre: codeBlock(),
    aside: (props: Props<'aside'>) => {
      const variant = props.node && stringProperty(props.node, 'dataCallout')
      if (variant === 'note' || variant === 'warning') {
        return <Callout variant={variant}>{props.children}</Callout>
      }
      return <aside {...withoutNode(props)} />
    },
    figure: (props: Props<'figure'>) => {
      const { node } = props
      const kind = node && stringProperty(node, 'dataKind')

      if (node && kind === 'code') {
        const pre = childElement(node, 'pre')
        return pre
          ? render(pre, {
              ...components,
              pre: codeBlock(stringProperty(node, 'dataTitle')),
            })
          : null
      }

      const caption = node && childElement(node, 'figcaption')
      const figure = {
        caption: caption ? textOf(caption).trim() : undefined,
        number: node && figureNumbers.get(node),
      }

      if (node && kind === 'image') {
        const picture = childElement(node, 'picture')
        return (
          <Figure {...figure}>{picture && render(picture, components)}</Figure>
        )
      }

      const video = node && kind === 'video' && childElement(node, 'video')
      if (video) {
        const width = numberProperty(video, 'width')
        const height = numberProperty(video, 'height')
        if (width === undefined || height === undefined) return null
        return (
          <Figure {...figure}>
            <Video
              sources={videoSources(video)}
              width={width}
              height={height}
              poster={stringProperty(video, 'poster')}
            />
          </Figure>
        )
      }

      return <figure {...withoutNode(props)} />
    },
  }

  return components
}

interface ArticleBodyProps {
  /** The post body as rendered by the content pipeline. */
  body: Root
  className?: string
}

/**
 * Turns a post's hast tree into React elements, mapping elements to the UI
 * primitives (code blocks, figures, videos and callouts) and giving the rest
 * the article typography.
 */
export function ArticleBody({ body, className }: ArticleBodyProps) {
  return (
    <div
      className={cn(
        'text-body text-fg-body [&>:first-child]:mt-0 [&>:last-child]:mb-0',
        className
      )}
    >
      {render(body, createComponents(body))}
    </div>
  )
}
