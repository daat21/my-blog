'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { NotionRenderer } from 'react-notion-x'
import type { ExtendedRecordMap } from 'notion-types'
import TagFromNotion from '@/components/blogs/TagFromNotion'
import { formatDate, formatDateOnly } from '@/lib/formatDate'
import type { BlogListItem } from '@/lib/notion/notion-blogs-list'

let prismLanguagesPromise: Promise<unknown[]> | null = null

const ensurePrismLanguages = () => {
  if (typeof window === 'undefined') return Promise.resolve([])
  if (!prismLanguagesPromise) {
    prismLanguagesPromise = Promise.all([
      import('prismjs/components/prism-bash'),
      import('prismjs/components/prism-c'),
      import('prismjs/components/prism-clike'),
      import('prismjs/components/prism-cpp'),
      import('prismjs/components/prism-csharp'),
      import('prismjs/components/prism-dart'),
      import('prismjs/components/prism-docker'),
      import('prismjs/components/prism-go'),
      import('prismjs/components/prism-graphql'),
      import('prismjs/components/prism-java'),
      import('prismjs/components/prism-javascript'),
      import('prismjs/components/prism-jsx'),
      import('prismjs/components/prism-json'),
      import('prismjs/components/prism-kotlin'),
      import('prismjs/components/prism-less'),
      import('prismjs/components/prism-lua'),
      import('prismjs/components/prism-makefile'),
      import('prismjs/components/prism-markdown'),
      import('prismjs/components/prism-objectivec'),
      import('prismjs/components/prism-ocaml'),
      import('prismjs/components/prism-python'),
      import('prismjs/components/prism-rust'),
      import('prismjs/components/prism-sass'),
      import('prismjs/components/prism-scss'),
      import('prismjs/components/prism-sql'),
      import('prismjs/components/prism-swift'),
      import('prismjs/components/prism-tsx'),
      import('prismjs/components/prism-typescript'),
      import('prismjs/components/prism-yaml'),
    ])
  }
  return prismLanguagesPromise
}

const Code = dynamic(
  () =>
    import('react-notion-x/build/third-party/code').then(async m => {
      await ensurePrismLanguages()
      return m.Code
    }),
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
        <hr className="border-border my-10" />
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
