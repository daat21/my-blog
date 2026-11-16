import type { ElementContent } from 'hast'
import type { Root, RootContent } from 'mdast'
import { toString } from 'mdast-util-to-string'
import type { Plugin } from 'unified'
import { SKIP, visit } from 'unist-util-visit'

import { ContentError, locate } from '@/lib/content/content-error'
import { isMediaRef } from '@/lib/content/media-ref'
import { resolveVideo } from '@/lib/content/resolve-media'
import type { MediaRef, ResolvedVideo } from '@/lib/media/types'

import type { MarkdownContext } from './context'
import { element, text } from './hast'

type Directive = Extract<
  RootContent,
  { type: 'containerDirective' | 'leafDirective' | 'textDirective' }
>
type ContainerDirective = Extract<Directive, { type: 'containerDirective' }>
type LeafDirective = Extract<Directive, { type: 'leafDirective' }>

const CALLOUTS = new Set(['note', 'warning'])

const MARKERS: Record<Directive['type'], string> = {
  containerDirective: ':::',
  leafDirective: '::',
  textDirective: ':',
}

interface PendingVideo {
  node: LeafDirective
  ref: MediaRef
  caption: string
}

function unknownDirective(node: Directive, file: string): ContentError {
  const hint =
    node.type === 'textDirective'
      ? '. To write a colon directly before a word, escape it as \\:'
      : ''
  return new ContentError(
    `${locate(file, node)}: Unknown directive "${MARKERS[node.type]}${node.name}"; the supported directives are :::note, :::warning and ::video${hint}`
  )
}

function checkCallout(node: ContainerDirective, file: string): void {
  const where = locate(file, node)
  const first = node.children[0]
  if (first?.type === 'paragraph' && first.data?.directiveLabel) {
    throw new ContentError(`${where}: :::${node.name} does not take a [label]`)
  }
  if (Object.keys(node.attributes ?? {}).length > 0) {
    throw new ContentError(
      `${where}: :::${node.name} does not take {attributes}`
    )
  }
}

function checkVideo(node: LeafDirective, file: string): PendingVideo {
  const where = locate(file, node)
  const { src, ...rest } = node.attributes ?? {}
  const unknown = Object.keys(rest)
  if (unknown.length > 0) {
    throw new ContentError(
      `${where}: ::video does not take ${unknown.map(name => `"${name}"`).join(', ')}; only src is supported`
    )
  }
  if (!src || !isMediaRef(src)) {
    throw new ContentError(
      `${where}: ::video needs src="media:<path below media/>"`
    )
  }
  const caption = toString(node).trim()
  if (!caption) {
    throw new ContentError(
      `${where}: ::video needs a caption: ::video[Caption]{src="${src}"}`
    )
  }
  return { node, ref: src, caption }
}

function videoFigureChildren(
  video: ResolvedVideo,
  caption: string
): ElementContent[] {
  return [
    element(
      'video',
      {
        autoPlay: true,
        muted: true,
        loop: true,
        playsInline: true,
        width: video.width,
        height: video.height,
        ...(video.poster ? { poster: video.poster } : {}),
      },
      video.sources.map(source =>
        element('source', { src: source.src, type: source.type })
      )
    ),
    element('figcaption', {}, [text(caption)]),
  ]
}

/**
 * Handles the directives content may use, and rejects every other one:
 *
 * - `::video[Caption]{src="media:…"}` becomes
 *   `<figure data-kind="video"><video …><source …></video><figcaption>`.
 *   Videos replace animated GIFs, so they autoplay muted and loop.
 * - `:::note` and `:::warning` become `<aside data-callout="note|warning">`.
 */
export const remarkDirectives: Plugin<[MarkdownContext], Root> =
  context => async tree => {
    const pending: PendingVideo[] = []

    visit(tree, node => {
      if (node.type === 'containerDirective') {
        if (!CALLOUTS.has(node.name)) {
          throw unknownDirective(node, context.file)
        }
        checkCallout(node, context.file)
        node.data = {
          ...node.data,
          hName: 'aside',
          hProperties: { dataCallout: node.name },
        }
        return
      }
      if (node.type === 'leafDirective') {
        if (node.name !== 'video') throw unknownDirective(node, context.file)
        pending.push(checkVideo(node, context.file))
        return SKIP
      }
      if (node.type === 'textDirective') {
        throw unknownDirective(node, context.file)
      }
      return
    })

    await Promise.all(
      pending.map(async ({ node, ref, caption }) => {
        const video = await resolveVideo(
          context.media,
          ref,
          locate(context.file, node)
        )
        node.data = {
          ...node.data,
          hName: 'figure',
          hProperties: { dataKind: 'video' },
          hChildren: videoFigureChildren(video, caption),
        }
      })
    )
  }
