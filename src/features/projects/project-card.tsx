import { MediaImage } from '@/components/ui/media-image'
import { SeparatedList } from '@/components/ui/separated-list'
import type { Project } from '@/lib/content'
import { cn } from '@/lib/utils'

/**
 * Rendered thumbnail width in each tier: full width less the page gutters on
 * phones, half the column from medium up, and at most 370px once the column
 * reaches its 760px cap.
 */
const THUMBNAIL_SIZES =
  '(min-width: 1024px) 370px, (min-width: 768px) calc(50vw - 58px), calc(100vw - 32px)'

interface ProjectCardProps {
  project: Project
  /** The title's heading level, one below the heading of its list. */
  headingLevel: 2 | 3
}

/**
 * A project with its screenshot, status, description and stack. The whole
 * card links to the live site, or to the repository when there is none,
 * through the title link, so its accessible name is just the title.
 */
export function ProjectCard({ project, headingLevel }: ProjectCardProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const href = project.url ?? project.repo
  const badge = project.status ?? project.year

  return (
    <article
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-lg border border-border',
        href &&
          'transition-colors duration-150 hover:border-border-strong has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent'
      )}
    >
      {project.image && (
        <div className="aspect-16/10 border-b border-border bg-sunken">
          <MediaImage
            image={project.image}
            // The title right below names what the screenshot shows.
            alt=""
            sizes={THUMBNAIL_SIZES}
            className="size-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-col gap-1.5 px-4.5 pt-4 pb-4.5">
        <div className="flex items-baseline justify-between gap-3">
          <Heading className="text-body leading-snug font-semibold text-fg">
            {href ? (
              <a
                href={href}
                className="outline-none after:absolute after:inset-0"
              >
                {project.title}
              </a>
            ) : (
              project.title
            )}
          </Heading>
          {badge && (
            <span
              className={cn(
                'shrink-0 font-mono text-meta',
                project.status === 'in progress'
                  ? 'text-accent'
                  : 'text-fg-muted'
              )}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm leading-relaxed text-fg-muted">
          {project.description}
        </p>
        {project.stack.length > 0 && (
          <p className="pt-1 font-mono text-meta text-fg-muted">
            <SeparatedList items={project.stack} />
          </p>
        )}
      </div>
    </article>
  )
}
