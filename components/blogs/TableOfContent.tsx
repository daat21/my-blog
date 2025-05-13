'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface HeadingItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
  className?: string
  position?: 'left' | 'right'
}

export function TableOfContents({
  content,
  className,
  position = 'left',
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const extractHeadings = () => {
      //   const regex = /^(#{1,2})\s+(.+)$/gm
      const regex = /^(#{1,6})\s+(.+)$/gm
      const matches = [...content.matchAll(regex)]

      const items: HeadingItem[] = matches.map((match, index) => {
        const level = match[1].length
        const text = match[2]
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')

        return { id, text, level }
      })

      setHeadings(items)
    }

    extractHeadings()
  }, [content])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '0px 0px -80% 0px' }
    )

    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
    headingElements.forEach(element => observer.observe(element))

    return () => {
      headingElements.forEach(element => observer.unobserve(element))
    }
  }, [headings])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  if (headings.length === 0) return null

  return (
    <div
      className={cn(
        'bg-background/80 fixed top-24 z-10 hidden max-h-[calc(100vh-120px)] w-56 overflow-y-auto rounded-md border p-4 backdrop-blur-sm lg:block',
        position === 'left' ? 'left-4' : 'right-4',
        className
      )}
    >
      <h4 className="mb-3 text-sm font-semibold">Content</h4>
      <nav>
        <ul className="space-y-1 text-sm">
          {headings.map(heading => (
            <li
              key={heading.id}
              className={cn(
                'hover:text-primary cursor-pointer transition-colors',
                {
                  'text-primary font-medium': activeId === heading.id,
                  'text-muted-foreground': activeId !== heading.id,
                },
                heading.level === 1 ? 'pl-0' : `pl-${heading.level * 2}`
              )}
              onClick={() => scrollToHeading(heading.id)}
              style={{ paddingLeft: `${(heading.level - 1) * 0.75}rem` }}
            >
              {heading.text}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
