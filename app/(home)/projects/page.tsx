import { ProjectCard } from '@/components/pages/Cards'
import { createClient } from '@/lib/supabase/server'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase.from('projects').select('*')

  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="border-0 text-2xl font-semibold md:mt-10 md:text-3xl">
        My Projects
      </h2>
      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 justify-items-center gap-4 md:grid-cols-3 md:gap-12">
        {projects?.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
