import { ProjectCard } from '@/components/pages/Cards'

export default function ProjectsPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="border-0 text-2xl md:mt-10 md:text-3xl">My Projects</h2>
      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 justify-items-center gap-4 md:grid-cols-3 md:gap-12">
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
      </div>
    </div>
  )
}
