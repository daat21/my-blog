import type { ExperienceEntry } from '@/lib/content'
import { cn } from '@/lib/utils'

import { ExperienceDates } from './experience-dates'
import { ExperienceProjects } from './experience-projects'

interface ExperienceTimelineProps {
  entries: readonly ExperienceEntry[]
}

/**
 * Roles as a vertical timeline, in the profile's order. Ongoing roles (no
 * end) get a filled accent dot; past ones a hollow dot.
 */
export function ExperienceTimeline({ entries }: ExperienceTimelineProps) {
  return (
    <ol>
      {entries.map((entry, index) => {
        const ongoing = entry.end === undefined
        const isLast = index === entries.length - 1
        return (
          <li
            key={`${entry.organization}:${entry.role}:${entry.start}`}
            className={cn('relative pl-8', !isLast && 'pb-8')}
          >
            {!isLast && (
              <span
                aria-hidden="true"
                className="absolute top-5 bottom-0 left-1.25 w-px bg-border"
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                'absolute top-1.5 left-0 size-2.75 rounded-full',
                ongoing
                  ? 'bg-accent'
                  : 'border-2 border-border-strong bg-canvas'
              )}
            />
            <div className="flex flex-col gap-1">
              <p
                className={cn(
                  'font-mono text-meta',
                  ongoing ? 'text-accent' : 'text-fg-muted'
                )}
              >
                <ExperienceDates start={entry.start} end={entry.end} />
              </p>
              <p className="text-body leading-snug font-semibold text-fg">
                {entry.role} · {entry.organization}
              </p>
              {entry.note && (
                <p className="font-mono text-meta text-fg-muted">
                  {entry.note}
                </p>
              )}
              <p className="text-ui leading-relaxed text-fg-muted">
                {entry.summary}
              </p>
            </div>
            {entry.projects && entry.projects.length > 0 && (
              <ExperienceProjects projects={entry.projects} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
