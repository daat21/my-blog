import type { ElementContent } from 'hast'
import type { Image, Paragraph, Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

import { ContentError, locate } from '@/lib/content/content-error'
import { isMediaRef } from '@/lib/content/media-ref'
import { resolveImage } from '@/lib/content/resolve-media'
import type { MediaRef, ResolvedImage } from '@/lib/media/types'

import type { MarkdownContext } from './context'
import { element, text } from './hast'

interface PendingFigure {
  paragraph: Paragraph
  image: Image
  ref: MediaRef
}

function standsAlone(paragraph: Paragraph, image: Image): boolean {
  return paragraph.children.every(
    child =>
      child === image || (child.type === 'text' && child.value.trim() === '')
  )
}

function figureChildren(
  image: ResolvedImage,
  alt: string,
  caption: string | null | undefined
): ElementContent[] {
  const picture = element('picture', {}, [
    ...image.sources.map(source =>
      element('source', { type: source.type, srcSet: source.srcSet })
    ),
    element('img', {
      src: image.src,
      alt,
      width: image.width,
      height: image.height,
      loading: 'lazy',
      decoding: 'async',
    }),
  ])
  const trimmed = caption?.trim()
  return trimmed
    ? [picture, element('figcaption', {}, [text(trimmed)])]
    : [picture]
}

/** Validates an inline image's alt text and logical media reference. */
export function imageRef(image: Image, file: string): MediaRef {
  const where = locate(file, image)
  if (!image.alt?.trim()) {
    throw new ContentError(
      `${where}: Image ${image.url} has no alt text; describe it in ![alt](…)`
    )
  }
  if (!isMediaRef(image.url)) {
    throw new ContentError(
      `${where}: Image URL "${image.url}" is not allowed; reference media as media:<path below media/>`
    )
  }
  return image.url
}

/**
 * Turns `![alt](media:path "caption")` into
 * `<figure data-kind="image"><picture>…</picture><figcaption>…</figcaption></figure>`.
 * It also enforces the image rules: alt text is required, only `media:`
 * references are allowed, and each image stands in a paragraph of its own
 * (a figure cannot sit inside a `<p>`).
 */
export const remarkImages: Plugin<[MarkdownContext], Root> =
  context => async tree => {
    const pending: PendingFigure[] = []

    visit(tree, (node, _index, parent) => {
      if (node.type === 'imageReference') {
        throw new ContentError(
          `${locate(context.file, node)}: Reference-style images are not supported; write ![alt](media:path) instead`
        )
      }
      if (node.type !== 'image') return

      const where = locate(context.file, node)
      const ref = imageRef(node, context.file)
      if (parent?.type !== 'paragraph' || !standsAlone(parent, node)) {
        throw new ContentError(
          `${where}: Image ${ref} must stand in a paragraph of its own, separated by blank lines`
        )
      }
      pending.push({ paragraph: parent, image: node, ref })
    })

    await Promise.all(
      pending.map(async ({ paragraph, image, ref }) => {
        const resolved = await resolveImage(
          context.media,
          ref,
          locate(context.file, image)
        )
        paragraph.data = {
          ...paragraph.data,
          hName: 'figure',
          hProperties: { dataKind: 'image' },
          hChildren: figureChildren(resolved, image.alt ?? '', image.title),
        }
      })
    )
  }
