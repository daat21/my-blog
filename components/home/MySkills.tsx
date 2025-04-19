import { MySkillsDock } from './myskills/MySkillsDock'
import { OrbitingCirclesDemo } from './myskills/IconCloud'

export default function MySkills() {
  return (
    <div className="mt-10 flex flex-col md:items-center md:gap-6 md:p-10">
      <h1 className="border-0 text-2xl md:text-4xl">My Skills</h1>
      <div className="relative hidden md:block">
        <MySkillsDock />
      </div>
      <div className="md:hidden">
        <OrbitingCirclesDemo />
      </div>
    </div>
  )
}
