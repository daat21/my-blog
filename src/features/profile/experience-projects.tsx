import { SeparatedList } from '@/components/ui/separated-list'
import type { ExperienceProject } from '@/lib/content'
import { cn } from '@/lib/utils'

import { ExperienceDates } from './experience-dates'

interface ExperienceProjectsProps {
  projects: readonly ExperienceProject[]
}

export function ExperienceProjects({ projects }: ExperienceProjectsProps) {
  return (
    <ol className="mt-4 ml-1">
      {projects.map((project, index) => (
        <li
          key={`${project.title}:${project.start}`}
          className={cn('relative pl-6', index < projects.length - 1 && 'pb-5')}
        >
          {index < projects.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute top-4 bottom-0 left-0.75 w-px bg-border/60"
            />
          )}
          <span
            aria-hidden="true"
            className="absolute top-1.5 left-0 size-1.75 rounded-full border border-border bg-canvas"
          />
          <div className="flex flex-col gap-1">
            <p className="font-mono text-meta text-fg-muted">
              <ExperienceDates start={project.start} end={project.end} />
            </p>
            <p className="text-ui text-fg">
              <span className="block font-medium">{project.title}</span>{' '}
              <SeparatedList
                className="flex text-fg-muted"
                separator="→"
                items={project.role.split('→').map(step => step.trim())}
              />
            </p>
            <p className="text-sm text-fg-muted">{project.summary}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
