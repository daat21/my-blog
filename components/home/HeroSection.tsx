'use client'

import { BackgroundBeamsWithCollision } from '../ui/background-beams-with-collision'
import ColourfulText from '../ui/colourful-text'
import { FlipWords } from '../ui/flip-words'
import { TextGenerateEffect } from '../ui/text-generate-effect'
import { TracingBeam } from '../ui/tracing-beam'
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button'

export default function HeroSection() {
  return (
    <TracingBeam className="px-0 md:px-4">
      <BackgroundBeamsWithCollision className="flex h-max flex-col gap-2 pb-10 pl-5 md:gap-4 md:pl-0">
        <h1 className="mt-20 text-2xl md:mt-40 md:text-5xl">Hello! 👋</h1>
        <h1 className="text-2xl md:text-5xl">
          I&apos;m <FlipWords words={['Daming', 'Damon']} />
          Chen,
        </h1>
        <h1 className="text-2xl md:text-5xl">
          a <ColourfulText text="Web <Developer />" />. 🧑‍💻
        </h1>
        <TextGenerateEffect
          // duration={0.1}
          words="I'm a postgraduate student at the University of Adelaide. I'm passionate about coding, photography, and gaming. My goal is to become a full stack developer. I love learning new technologies and building projects that interest me. On this website, I share my journey in tech as well as snippets of my everyday life."
        />
        <InteractiveHoverButton className="mt-2 w-fit items-center gap-2">
          Send Me an Email
        </InteractiveHoverButton>
      </BackgroundBeamsWithCollision>
    </TracingBeam>
  )
}
