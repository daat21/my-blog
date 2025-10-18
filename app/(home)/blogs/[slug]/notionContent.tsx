'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { NotionRenderer } from 'react-notion-x'
import type { ExtendedRecordMap } from 'notion-types'
import TagFromNotion from '@/components/blogs/TagFromNotion'
import { formatDate, formatDateOnly } from '@/lib/formatDate'
import type { BlogListItem } from '@/lib/notion/notion-blogs-list'

const Code = dynamic(
  () => import('react-notion-x/build/third-party/code').then(m => m.Code),
  { ssr: false }
)
const BaseCollection = dynamic(
  () =>
    import('react-notion-x/build/third-party/collection').then(
      m => m.Collection
    ),
  { ssr: false }
)
const Equation = dynamic(
  () =>
    import('react-notion-x/build/third-party/equation').then(m => m.Equation),
  { ssr: false }
)
const Pdf = dynamic(
  () => import('react-notion-x/build/third-party/pdf').then(m => m.Pdf),
  { ssr: false }
)
const Modal = dynamic(
  () => import('react-notion-x/build/third-party/modal').then(m => m.Modal),
  { ssr: false }
)

const Collection = (props: any) => {
  const block = props?.block

  if (block?.type === 'page' && block?.parent_table === 'collection') {
    return (
      <div className="notion-width-wrapper not-prose">
        <hr className="my-10 border-border" />
      </div>
    )
  }

  return <BaseCollection {...props} />
}

export default function NotionContent({
  recordMap,
  metadata,
}: {
  recordMap: ExtendedRecordMap
  metadata: BlogListItem
}) {
  const { tags, date, last_edited_time, description, title } = metadata
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const publishedLabel = date ? formatDateOnly(date) : null
  const updatedLabel =
    mounted && last_edited_time ? formatDate(last_edited_time) : null

  return (
    <div className="prose dark:prose-invert max-w-none">
      <div className="notion-width-wrapper not-prose">
        <header className="mb-10 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            {title}
          </h1>
          {tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <TagFromNotion key={tag.id} name={tag.name} color={tag.color} />
              ))}
            </div>
          ) : null}
          {(publishedLabel || updatedLabel) && (
            <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
              {publishedLabel && <span>Published {publishedLabel}</span>}
              {publishedLabel && updatedLabel && <span>•</span>}
              {updatedLabel && <span>Updated {updatedLabel}</span>}
            </div>
          )}
          {description ? (
            <p className="text-ring italic">{description}</p>
          ) : null}
          {metadata.cover_image_url ? (
            <figure className="not-prose mb-10 overflow-hidden rounded-3xl">
              <Image
                src={metadata.cover_image_url}
                alt={title}
                width={1600}
                height={900}
                className="h-auto w-full object-cover"
                priority
                sizes="100vw"
              />
            </figure>
          ) : null}
        </header>
      </div>
      <NotionRenderer
        recordMap={recordMap}
        fullPage={false}
        darkMode={false}
        components={{ Code, Collection, Equation, Pdf, Modal }}
      />
    </div>
  )
}
