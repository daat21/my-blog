'use client'

import { MagicCard } from '@/components/magicui/magic-card'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Tag from '@/components/blogs/Tag'

export function HorizontalCard() {
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
    <Card className="h-[124px] w-full overflow-hidden border-none p-0 shadow-none">
      <MagicCard className="h-[124px] w-full" gradientColor={gradientColor}>
        <CardContent className="flex gap-2 p-0">
          <Image
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48"
            alt="Title"
            width={100}
            height={100}
            className="h-[124px] w-[124px] rounded-2xl rounded-r-none object-cover p-1"
          />
          <div className="p-1">
            <h3 className="text-xl font-bold">Title</h3>
            <span className="text-muted-foreground text-sm">Release Date</span>
            <p className="mt-2 mr-2 text-sm">
              Overview Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Quisquam, Overview Lorem ipsum dolor sit amet consectetur
              adipisicing elit. Quisquam, quos.
            </p>
          </div>
        </CardContent>
      </MagicCard>
    </Card>
  )
}

export function BlogCard() {
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
    <Card className="w-full overflow-hidden border-none p-0 shadow-none">
      <MagicCard className="w-full" gradientColor={gradientColor}>
        <CardContent className="flex gap-2 p-0">
          <Image
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48"
            alt="Title"
            width={172}
            height={172}
            className="rounded-2xl rounded-r-none object-cover p-1 md:h-[172px] md:w-[172px]"
          />
          <div className="my-2 p-1">
            <h3 className="text-xl font-bold">Title</h3>
            <span className="text-ring text-sm">Release Date</span>
            <p className="text-muted-foreground mt-2 mr-2 text-sm">
              Overview Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Quisquam, Overview Lorem ipsum dolor sit amet consectetur
              adipisicing elit. Quisquam, quos.
            </p>
            <span>
              <Tag name="Next.js" color="#b91c1c" className="border-none" />
              <Tag
                name="Tailwind CSS"
                color="#c2410c"
                className="border-none"
              />
              <Tag name="TypeScript" color="#c27b0c" className="border-none" />
            </span>
          </div>
        </CardContent>
      </MagicCard>
    </Card>
  )
}

export function ProjectCard() {
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
    <Card className="h-[350px] w-[276px] overflow-hidden border-none p-0 shadow-none">
      <MagicCard className="h-[350px] w-[276px]" gradientColor={gradientColor}>
        <CardContent className="flex flex-col gap-2 p-0">
          <Image
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48"
            alt="Title"
            width={276}
            height={176}
            className="h-[176px] w-[276px] rounded-2xl rounded-b-none object-cover p-1"
          />
          <div className="p-4">
            <h3 className="text-xl font-bold">Project Name</h3>
            <p className="text-muted-foreground mt-6 text-sm">
              A web app that allows users to practice for front-end and Ul
              interviews.
            </p>
          </div>
        </CardContent>
      </MagicCard>
    </Card>
  )
}
