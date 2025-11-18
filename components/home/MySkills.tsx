'use client'

import dynamic from 'next/dynamic'
import { MySkillsDock } from './my-skills/MySkillsDock'

// Lazy load IconCloud (heavy 3D canvas component)
const IconCloud = dynamic(
  () => import('./my-skills/IconCloud').then(mod => mod.IconCloud),
  {
    ssr: false,
    loading: () => <div className="h-[400px] w-full" />,
  }
)

export default function MySkills() {
  return (
    <div className="mt-10 flex flex-col md:items-center md:p-10">
      <h2 className="border-0 text-2xl font-semibold md:text-4xl">My Skills</h2>
      <div className="relative hidden md:block">
        <MySkillsDock />
      </div>
      <div className="md:hidden">
        <IconCloud />
      </div>
    </div>
  )
}
