'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NotionRenderer } from 'react-notion-x'
import { useTheme } from 'next-themes'
import type { ExtendedRecordMap, PageBlock } from 'notion-types'
import { getPageTableOfContents, uuidToId } from 'notion-utils'
import TagFromNotion from '@/components/blogs/TagFromNotion'
import { formatDate, formatDateOnly } from '@/lib/formatDate'
import type { BlogListItem } from '@/lib/notion/notion-blogs-list'
import { cn } from '@/lib/utils'

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
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const activeSectionRef = useRef<string | null>(null)
  const tocContainerRef = useRef<HTMLDivElement | null>(null)
  const { resolvedTheme } = useTheme()
  const isDarkMode = mounted && resolvedTheme === 'dark'

  useEffect(() => {
    setMounted(true)
  }, [])

  const pageBlock = useMemo<PageBlock | null>(() => {
    if (!recordMap?.block) return null
    for (const block of Object.values(recordMap.block)) {
      if (block.value?.type === 'page') {
        return block.value as PageBlock
      }
    }
    return null
  }, [recordMap])

  const tableOfContents = useMemo(
    () =>
      pageBlock
        ? getPageTableOfContents(pageBlock, recordMap).filter(
            entry => entry.text
          )
        : [],
    [pageBlock, recordMap]
  )

  const tocItems = useMemo(
    () =>
      tableOfContents.map(item => ({
        ...item,
        targetId: uuidToId(item.id),
      })),
    [tableOfContents]
  )
  const hasTableOfContents = tocItems.length > 0

  useEffect(() => {
    if (tocItems.length === 0) {
      setActiveSection(null)
      return
    }
    setActiveSection(tocItems[0].targetId)
  }, [tocItems])

  useEffect(() => {
    activeSectionRef.current = activeSection
  }, [activeSection])

  useEffect(() => {
    if (!tocContainerRef.current || !activeSection) return
    const container = tocContainerRef.current
    const activeButton = container.querySelector<HTMLElement>(
      `[data-toc-id="${activeSection}"]`
    )
    if (!activeButton) return

    const buttonTop = activeButton.offsetTop
    const buttonBottom = buttonTop + activeButton.offsetHeight
    const viewTop = container.scrollTop
    const viewBottom = viewTop + container.clientHeight

    if (buttonTop < viewTop + 16) {
      container.scrollTo({
        top: Math.max(buttonTop - 32, 0),
        behavior: 'smooth',
      })
    } else if (buttonBottom > viewBottom - 16) {
      container.scrollTo({
        top: buttonBottom - container.clientHeight + 32,
        behavior: 'smooth',
      })
    }
  }, [activeSection])

  useEffect(() => {
    if (tocItems.length === 0 || typeof window === 'undefined') return

    let rafId: number | null = null
    let timeoutId: number | null = null

    function updateActiveSection() {
      rafId = null

      const sections = Array.from(
        document.getElementsByClassName('notion-h')
      ).filter((el): el is HTMLElement => el instanceof HTMLElement)

      if (sections.length === 0) {
        if (timeoutId !== null) window.clearTimeout(timeoutId)
        timeoutId = window.setTimeout(scheduleUpdate, 200)
        return
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
        timeoutId = null
      }

      let currentId = activeSectionRef.current ?? tocItems[0]?.targetId ?? null
      let prevBBox: DOMRect | null = null

      for (const section of sections) {
        const id = section.dataset.id
        if (!id) continue
        if (!currentId) currentId = id

        const bbox = section.getBoundingClientRect()
        const prevHeight = prevBBox ? bbox.top - prevBBox.bottom : 0
        const offset = Math.max(150, prevHeight / 4)

        if (bbox.top - offset < 0) {
          currentId = id
          prevBBox = bbox
          continue
        }
        break
      }

      if (currentId && currentId !== activeSectionRef.current) {
        setActiveSection(currentId)
      }
    }

    function scheduleUpdate() {
      if (rafId !== null) return
      rafId = window.requestAnimationFrame(updateActiveSection)
    }

    const handleScroll = () => {
      scheduleUpdate()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    scheduleUpdate()

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId)
      if (timeoutId !== null) window.clearTimeout(timeoutId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [tocItems])

  const handleSectionClick = useCallback((id: string) => {
    if (typeof window === 'undefined') return
    setActiveSection(id)
    const target =
      document.querySelector<HTMLElement>(`[data-id="${id}"]`) ??
      document.getElementById(id)
    if (!target) return

    const offset = 100
    const top = target.getBoundingClientRect().top + window.scrollY - offset

    window.scrollTo({ top, behavior: 'smooth' })
  }, [])

  const publishedLabel = date ? formatDateOnly(date) : null
  const updatedLabel =
    mounted && last_edited_time ? formatDate(last_edited_time) : null

  return (
    <div className="mx-auto w-full px-4 lg:px-8">
      <div className="xl:flex xl:justify-center xl:gap-20">
        {hasTableOfContents ? (
          <div
            className="hidden w-[260px] shrink-0 xl:block"
            aria-hidden="true"
          />
        ) : null}
        <div
          className={cn(
            'prose dark:prose-invert mx-auto w-full max-w-3xl lg:max-w-4xl',
            hasTableOfContents ? 'xl:mx-0' : 'xl:mx-auto'
          )}
        >
          <div className="notion-width-wrapper not-prose">
            <header className="mb-10 space-y-4">
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                {title}
              </h1>
              {tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <TagFromNotion
                      key={tag.id}
                      name={tag.name}
                      color={tag.color}
                    />
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
            darkMode={isDarkMode}
            components={{ Code, Collection, Equation, Pdf, Modal }}
          />
        </div>
        {hasTableOfContents ? (
          <aside className="relative hidden w-[260px] shrink-0 xl:block">
            <div className="sticky top-28">
              <div
                ref={tocContainerRef}
                className="no-scrollbar border-border/60 bg-card/60 max-h-[80vh] overflow-y-auto rounded-3xl border p-5 text-sm shadow-sm backdrop-blur"
              >
                <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                  Table of Contents
                </p>
                <ol className="space-y-2">
                  {tocItems.map(item => (
                    <li
                      key={item.targetId}
                      className={cn(
                        'transition-colors',
                        activeSection === item.targetId
                          ? 'text-primary font-semibold'
                          : 'text-muted-foreground hover:text-primary'
                      )}
                    >
                      <button
                        type="button"
                        data-toc-id={item.targetId}
                        onClick={() => handleSectionClick(item.targetId)}
                        className="w-full text-left"
                        style={{ paddingLeft: `${item.indentLevel * 16}px` }}
                      >
                        {item.text}
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
