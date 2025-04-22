'use client'

import { MagicCard } from '@/components/magicui/magic-card'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Tag from '@/components/blogs/Tag'
import type { Project, Blog } from '@/types'
import { formatDate } from '@/lib/formatDate'
import Link from 'next/link'
import { Button } from '../ui/button'

export function HorizontalCard({ blog }: { blog: Blog }) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const gradientColor = mounted
    ? theme === 'dark'
      ? '#262626'
      : '#D9D9D955'
    : '#262626'

  return (
    <Card className="w-full overflow-hidden border-none p-0 shadow-none md:h-[100px]">
      {/* <MagicCard className="w-full md:h-[100px]" gradientColor={gradientColor}> */}
      <MagicCard className="w-full md:h-[100px]">
        <Link href={`/blogs/${blog.slug}`}>
          <CardContent className="flex gap-2 p-0">
            <Image
              src={blog.cover_image_url}
              alt="Title"
              width={140}
              height={140}
              className="h-[100px] w-[100px] rounded-2xl rounded-r-none object-cover p-1"
            />
            <div className="my-2 flex flex-col justify-between p-1">
              <h3 className="text-base font-medium md:text-lg">{blog.title}</h3>
              <span className="text-ring text-sm">
                {formatDate(blog.published_at)}
              </span>
              <p className="text-muted-foreground mt-2 mr-2 hidden text-sm md:block">
                {blog.excerpt.length > 80
                  ? `${blog.excerpt.slice(0, 80)}...`
                  : blog.excerpt}
              </p>
            </div>
          </CardContent>
        </Link>
      </MagicCard>
    </Card>
  )
}

export function BlogCard({ blog }: { blog: Blog }) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const gradientColor = mounted
    ? theme === 'dark'
      ? '#262626'
      : '#D9D9D955'
    : '#262626'

  return (
    <Card className="h-[140px] w-full overflow-hidden border-none p-0 shadow-none md:h-[172px]">
      <MagicCard
        className="h-[140px] w-full md:h-[172px]"
        // gradientColor={gradientColor}
      >
        <Link href={`/blogs/${blog.slug}`}>
          <CardContent className="flex gap-2 p-0">
            <Image
              src={blog.cover_image_url}
              alt="Title"
              width={172}
              height={172}
              className="h-[140px] w-[100px] rounded-2xl rounded-r-none object-cover p-1 md:h-[172px] md:w-[172px]"
            />
            <div className="my-2 flex flex-col justify-between p-1">
              <h3 className="font-medium md:text-xl">{blog.title}</h3>
              <span className="text-ring text-sm">
                {formatDate(blog.published_at)}
              </span>
              <p className="text-muted-foreground mt-2 mr-2 hidden text-sm md:block">
                {blog.excerpt}
              </p>
              <span>
                {blog.tags?.map(tag => (
                  <Tag
                    key={tag.id}
                    name={tag.name}
                    color={tag.color}
                    className="border-none"
                  />
                ))}
              </span>
            </div>
          </CardContent>
        </Link>
      </MagicCard>
    </Card>
  )
}

export function ProjectCard({ project }: { project: Project }) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const gradientColor = mounted
    ? theme === 'dark'
      ? '#262626'
      : '#D9D9D955'
    : '#262626'

  return (
    <Card className="h-fit w-[276px] overflow-hidden border-none p-0 shadow-none">
      {/* <MagicCard className="h-full w-[276px]" gradientColor={gradientColor}> */}
      <MagicCard className="h-full w-[276px]">
        <CardContent className="flex flex-col gap-2 p-0">
          <Image
            src={project.cover_image_url}
            alt="Title"
            width={276}
            height={176}
            className="h-[176px] w-[276px] rounded-2xl rounded-b-none object-cover p-1"
          />
          <div className="p-4">
            <h3 className="text-xl font-medium">{project.name}</h3>
            <p className="text-muted-foreground mt-6 text-sm">
              {project.description}
            </p>
            <div className="flex gap-4 pt-8">
              {project.github_url && (
                <Button className="flex-auto rounded-2xl" asChild>
                  <Link
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </Link>
                </Button>
              )}
              {project.project_url && (
                <Button
                  variant="outline"
                  className="flex-auto rounded-2xl"
                  asChild
                >
                  <Link
                    href={project.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Website
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </MagicCard>
    </Card>
  )
}
