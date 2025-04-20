import { ProjectCard } from '@/components/pages/Cards'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export async function MyProjects() {
  const supabase = await createClient()
  const { data: projects } = await supabase.from('projects').select('*')

  return (
    <div className="w-full rounded-lg border p-8">
      <Link href="/projects">
        <h2 className="cursor-pointer border-0 text-center text-xl md:mb-4 md:text-2xl">
          My Projects
        </h2>
      </Link>
      <div className="mx-auto grid max-w-5xl grid-cols-1 justify-items-center gap-4 md:grid-cols-3 md:gap-12">
        {projects?.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
