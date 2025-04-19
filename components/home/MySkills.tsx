import { MySkillsDock } from './my-skills/MySkillsDock'
import { IconCloud } from './my-skills/IconCloud'

export default function MySkills() {
  return (
    <div className="mt-10 flex flex-col md:items-center md:p-10">
      <h2 className="border-0 text-2xl md:text-4xl">My Skills</h2>
      <div className="relative hidden md:block">
        <MySkillsDock />
      </div>
      <div className="md:hidden">
        <IconCloud />
      </div>
    </div>
  )
}
