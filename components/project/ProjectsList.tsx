import { createClient } from '@/lib/supabase/server'
import { ProjectCard } from '../pages/Cards'

export default async function ProjectsList() {
  const supabase = await createClient()
  const { data: projects } = await supabase.from('projects').select('*')

  return (
    <>
      {projects?.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </>
  )
}
