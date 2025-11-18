'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamically import animation components to reduce initial bundle
const BackgroundBeamsWithCollision = dynamic(
  () =>
    import('../ui/background-beams-with-collision').then(
      mod => mod.BackgroundBeamsWithCollision
    ),
  { ssr: false }
)

const ColourfulText = dynamic(() => import('../ui/colourful-text'), {
  ssr: false,
})

const FlipWords = dynamic(
  () => import('../ui/flip-words').then(mod => mod.FlipWords),
  { ssr: false }
)

const TextGenerateEffect = dynamic(
  () => import('../ui/text-generate-effect').then(mod => mod.TextGenerateEffect),
  { ssr: false }
)

const InteractiveHoverButton = dynamic(
  () =>
    import('@/components/magicui/interactive-hover-button').then(
      mod => mod.InteractiveHoverButton
    ),
  { ssr: false }
)

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
