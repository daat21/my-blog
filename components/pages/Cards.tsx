'use client'

import { MagicCard } from '@/components/magicui/magic-card'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Tag from '@/components/blogs/Tag'
import type { Project, Blog, BlogsFromNotion } from '@/types'
import { formatDate } from '@/lib/formatDate'
import Link from 'next/link'
import { Button } from '../ui/button'
import TagFromNotion from '../blogs/TagFromNotion'

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
        <Link href={`/blogs/${blog.slug}`} prefetch={true}>
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
              <span className="text-muted-foreground text-sm">
                {mounted ? formatDate(blog.updated_at) : ''}
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

export function HorizontalCardFromNotion({ blog }: { blog: BlogsFromNotion }) {
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
        <Link href={`/blogs/${blog.slug}`} prefetch={true}>
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
              <span className="text-muted-foreground text-sm">
                {mounted ? formatDate(blog.date) : ''}
              </span>
              <p className="text-muted-foreground mt-2 mr-2 hidden text-sm md:block">
                {blog.description.length > 80
                  ? `${blog.description.slice(0, 80)}...`
                  : blog.description}
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
        <Link href={`/blogs/${blog.slug}`} prefetch={true}>
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
              <span className="text-muted-foreground text-sm">
                {mounted ? formatDate(blog.updated_at) : ''}
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

export function BlogFromNotionCard({ blog }: { blog: BlogsFromNotion }) {
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
        <Link href={`/blogs/${blog.slug}`} prefetch={true}>
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
              <span className="text-muted-foreground text-sm">
                {mounted ? formatDate(blog.date) : ''}
              </span>
              <p className="text-muted-foreground mt-2 mr-2 hidden text-sm md:block">
                {blog.description}
              </p>
              <span>
                {blog.tags?.map(tag => (
                  <TagFromNotion
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="36"
                      height="36"
                      fill="currentColor"
                    >
                      <path d="M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.86348 20.1625 8.83848 21.4875C9.33848 21.575 9.52598 21.275 9.52598 21.0125C9.52598 20.775 9.51348 19.9875 9.51348 19.15C7.00098 19.6125 6.35098 18.5375 6.15098 17.975C6.03848 17.6875 5.55098 16.8 5.12598 16.5625C4.77598 16.375 4.27598 15.9125 5.11348 15.9C5.90098 15.8875 6.46348 16.625 6.65098 16.925C7.55098 18.4375 8.98848 18.0125 9.56348 17.75C9.65098 17.1 9.91348 16.6625 10.201 16.4125C7.97598 16.1625 5.65098 15.3 5.65098 11.475C5.65098 10.3875 6.03848 9.4875 6.67598 8.7875C6.57598 8.5375 6.22598 7.5125 6.77598 6.1375C6.77598 6.1375 7.61348 5.875 9.52598 7.1625C10.326 6.9375 11.176 6.825 12.026 6.825C12.876 6.825 13.726 6.9375 14.526 7.1625C16.4385 5.8625 17.276 6.1375 17.276 6.1375C17.826 7.5125 17.476 8.5375 17.376 8.7875C18.0135 9.4875 18.401 10.375 18.401 11.475C18.401 15.3125 16.0635 16.1625 13.8385 16.4125C14.201 16.725 14.5135 17.325 14.5135 18.2625C14.5135 19.6 14.501 20.675 14.501 21.0125C14.501 21.275 14.6885 21.5875 15.1885 21.4875C19.259 20.1133 21.9999 16.2963 22.001 12C22.001 6.475 17.526 2 12.001 2Z"></path>
                    </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="36"
                      height="36"
                      fill="currentColor"
                    >
                      <path d="M20 22H4C3.44772 22 3 21.5523 3 21V8H21V21C21 21.5523 20.5523 22 20 22ZM21 6H3V3C3 2.44772 3.44772 2 4 2H20C20.5523 2 21 2.44772 21 3V6ZM7 11V15H11V11H7ZM7 17V19H17V17H7ZM13 12V14H17V12H13Z"></path>
                    </svg>
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
