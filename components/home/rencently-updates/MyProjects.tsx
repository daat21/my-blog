import { ProjectCard } from '@/components/pages/Cards'

export function MyProjects() {
  return (
    <div className="w-full rounded-lg border p-8">
      <h2 className="border-0 text-center text-xl md:mb-4 md:text-2xl">
        My Projects
      </h2>
      <div className="mx-auto grid max-w-5xl grid-cols-1 justify-items-center gap-4 md:grid-cols-3 md:gap-12">
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
      </div>
    </div>
  )
}
