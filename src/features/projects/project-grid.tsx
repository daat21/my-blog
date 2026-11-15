import type { Project } from '@/lib/content'

import { ProjectCard } from './project-card'

interface ProjectGridProps {
  projects: readonly Project[]
  /** Heading level of each card's title. */
  headingLevel: 2 | 3
}

/** Project cards: one column on phones, two from medium up. */
export function ProjectGrid({ projects, headingLevel }: ProjectGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {projects.map(project => (
        <li key={project.slug}>
          <ProjectCard project={project} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  )
}
