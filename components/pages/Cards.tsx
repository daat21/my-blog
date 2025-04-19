'use client'

import { MagicCard } from '@/components/magicui/magic-card'
import { Card, CardContent } from '@/components/ui/card'
import { useTheme } from 'next-themes'
import Image from 'next/image'

export function HorizontalCard() {
  const { theme } = useTheme()

  return (
    <Card className="h-[124px] w-full overflow-hidden border-none p-0 shadow-none">
      <MagicCard gradientColor={theme === 'dark' ? '#262626' : '#D9D9D955'}>
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
