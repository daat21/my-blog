'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MagicCard } from '@/components/magicui/magic-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function TagSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn(
        'inline-flex h-8 w-20 items-center rounded-2xl px-3 py-1.5',
        className
      )}
    />
  )
}

export function TagsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <TagSkeleton key={index} />
      ))}
    </div>
  )
}

export function HorizontalCardSkeleton() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Card className="w-full overflow-hidden border-none p-0 shadow-none md:h-[100px]">
      <MagicCard className="w-full md:h-[100px]">
        <CardContent className="flex gap-2 p-0">
          {/* Image skeleton */}
          <Skeleton className="h-[100px] w-[100px] rounded-2xl rounded-r-none p-1" />

          {/* Content skeleton */}
          <div className="my-2 flex w-full flex-col justify-between p-1">
            {/* Title skeleton */}
            <Skeleton className="h-6 w-3/4" />

            {/* Date skeleton */}
            <Skeleton className="mt-2 h-4 w-1/4" />

            {/* Description skeleton - hidden on mobile */}
            <Skeleton className="mt-2 mr-2 hidden h-4 w-full md:block" />
          </div>
        </CardContent>
      </MagicCard>
    </Card>
  )
}

export function BlogCardSkeleton() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Card className="h-[140px] w-[437px] overflow-hidden border-none p-0 shadow-none md:h-[172px] md:w-[1024px]">
      <MagicCard className="h-[140px] w-[437px] md:h-[172px] md:w-[1024px]">
        <CardContent className="flex gap-2 p-0">
          {/* Image skeleton */}
          <Skeleton className="h-[140px] w-[100px] rounded-2xl rounded-r-none p-1 md:h-[172px] md:w-[172px]" />

          {/* Content skeleton */}
          <div className="my-2 flex w-full flex-col justify-between p-1">
            {/* Title skeleton */}
            <Skeleton className="h-6 w-3/4 md:h-7" />

            {/* Date skeleton */}
            <Skeleton className="mt-2 h-4 w-1/4" />

            {/* Description skeleton - hidden on mobile */}
            <Skeleton className="mt-2 mr-2 hidden h-4 w-full md:block" />

            {/* Tags skeleton */}
            <div className="mt-2 flex gap-2">
              <TagSkeleton />
              <TagSkeleton />
            </div>
          </div>
        </CardContent>
      </MagicCard>
    </Card>
  )
}

export function ProjectCardSkeleton() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Card className="h-fit w-[276px] overflow-hidden border-none p-0 shadow-none">
      <MagicCard className="h-full w-[276px]">
        <CardContent className="flex flex-col gap-2 p-0">
          {/* Image skeleton */}
          <Skeleton className="h-[176px] w-[276px] rounded-2xl rounded-b-none p-1" />

          <div className="p-4">
            {/* Title skeleton */}
            <Skeleton className="h-7 w-3/4" />

            {/* Description skeleton */}
            <Skeleton className="mt-6 h-16 w-full" />

            {/* Buttons skeleton */}
            <div className="flex gap-4 pt-8">
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
            </div>
          </div>
        </CardContent>
      </MagicCard>
    </Card>
  )
}

export function RecentlyBlogsSkeleton() {
  return (
    <div className="flex min-h-[486px] w-full flex-col rounded-lg border p-4 md:p-8">
      <h3 className="cursor-pointer text-center text-xl font-semibold md:mb-4 md:text-2xl">
        Recently Updated
      </h3>

      <div className="mt-8 flex flex-col gap-8 md:mt-0">
        <HorizontalCardSkeleton />
        <HorizontalCardSkeleton />
        <HorizontalCardSkeleton />
      </div>
    </div>
  )
}

export function MyProjectsSkeleton() {
  return (
    <div className="w-full rounded-lg border p-8">
      <h3 className="mb-8 cursor-pointer border-0 text-center text-xl font-semibold md:mb-4 md:text-2xl">
        My Projects
      </h3>

      <div className="mx-auto grid max-w-5xl grid-cols-1 justify-items-center gap-8 md:grid-cols-3 md:gap-12">
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
      </div>
    </div>
  )
}

export function BlogsListSkeleton() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-10">
      <BlogCardSkeleton />
      <BlogCardSkeleton />
      <BlogCardSkeleton />
    </div>
  )
}

export function ProjectsListSkeleton() {
  return (
    <>
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
      <ProjectCardSkeleton />
    </>
  )
}

export function BlogDetailSkeleton() {
  return (
    <article className="prose dark:prose-invert lg:prose-lg mx-auto w-full p-4">
      {/* Title skeleton */}
      <Skeleton className="h-10 w-3/4 md:h-12" />

      {/* Tags skeleton */}
      <div className="mt-4">
        <TagsSkeleton />
      </div>

      {/* Date skeleton */}
      <Skeleton className="mt-4 h-5 w-52" />

      {/* Excerpt skeleton */}
      <Skeleton className="mt-6 h-16 w-full" />

      {/* Cover image skeleton */}
      <Skeleton className="mt-6 h-[300px] w-full md:h-[400px]" />

      <hr className="my-6" />

      {/* Content skeleton - paragraphs */}
      <div className="mt-8 space-y-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />

        {/* Heading skeleton */}
        <Skeleton className="mt-8 h-7 w-2/3" />

        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-full" />

        {/* Code block skeleton */}
        <Skeleton className="h-40 w-full rounded" />

        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
      </div>
    </article>
  )
}
