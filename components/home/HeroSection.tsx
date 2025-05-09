'use client'

import Link from 'next/link'
import { BackgroundBeamsWithCollision } from '../ui/background-beams-with-collision'
import ColourfulText from '../ui/colourful-text'
import { FlipWords } from '../ui/flip-words'
import { TextGenerateEffect } from '../ui/text-generate-effect'
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button'

export default function HeroSection() {
  return (
    <div>
      <BackgroundBeamsWithCollision className="flex h-max flex-col gap-2 pb-4 md:gap-4">
        <h1 className="text-2xl font-extrabold md:text-5xl">
          Hello! 👋
          <br />
          I&apos;m <FlipWords words={['Daming', 'Damon']} />
          Chen,
          <br /> a <ColourfulText text="Web <Developer />" />. 🧑‍💻
        </h1>
        <TextGenerateEffect
          // duration={0.1}
          words="I'm a postgraduate student at the University of Adelaide. I'm passionate about coding, photography, and gaming. My goal is to become a full stack developer. I love learning new technologies and building projects that interest me. On this website, I share my journey in tech as well as snippets of my everyday life."
        />
        <InteractiveHoverButton className="mt-2 w-fit items-center gap-2">
          <Link href="mailto:chen.daming@icloud.com">Send Me an Email</Link>
        </InteractiveHoverButton>
      </BackgroundBeamsWithCollision>
    </div>
  )
}
