import type { Metadata } from 'next'

import { SiteFooter } from '@/components/layout/site-footer'
import { ProjectGrid } from '@/features/projects'
import { listProjects } from '@/lib/content'

const DESCRIPTION =
  'Things I have built and keep working on, with what each one does and the stack behind it.'

export const metadata: Metadata = {
  title: 'Projects',
  description: DESCRIPTION,
}

export default async function ProjectsPage() {
  const projects = await listProjects()

  return (
    <div className="px-4 pt-10 pb-10 md:px-12 md:pt-12 lg:px-18 lg:pt-18 xl:px-22 xl:pt-22">
      <div className="mx-auto max-w-190">
        <div className="flex flex-col gap-10">
          <header className="flex flex-col gap-3">
            <h1 className="text-h1 font-semibold tracking-[-0.022em] text-fg">
              Projects
            </h1>
            <p className="max-w-155 text-body text-fg-muted">{DESCRIPTION}</p>
          </header>

          {projects.length > 0 ? (
            <ProjectGrid projects={projects} headingLevel={2} />
          ) : (
            <p className="text-body">No projects yet.</p>
          )}
        </div>
        <SiteFooter />
      </div>
    </div>
  )
}
