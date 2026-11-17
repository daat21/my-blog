import type { Metadata } from 'next'

import { SiteFooter } from '@/components/layout/site-footer'
import { SectionHeading } from '@/components/ui/section-heading'
import { ExperienceTimeline, Intro, StackGrid } from '@/features/profile'
import { pickHomeProjects, ProjectGrid } from '@/features/projects'
import { getProfile, listProjects } from '@/lib/content'

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile()
  return { description: profile.bio }
}

export default async function HomePage() {
  const [profile, projects] = await Promise.all([getProfile(), listProjects()])
  const homeProjects = pickHomeProjects(projects)

  return (
    <div className="flex flex-1 flex-col px-4 pt-10 pb-10 md:px-12 md:pt-12 lg:px-18 lg:pt-18 xl:px-22 xl:pt-22">
      <div className="mx-auto flex w-full max-w-190 flex-1 flex-col">
        <div className="flex flex-col gap-18">
          <Intro intro={profile.intro} links={profile.links} />

          {profile.stack.length > 0 && (
            <section aria-labelledby="stack">
              <SectionHeading id="stack">Stack</SectionHeading>
              <StackGrid groups={profile.stack} />
            </section>
          )}

          {profile.experience.length > 0 && (
            <section aria-labelledby="experience">
              <SectionHeading id="experience" className="mb-6">
                Experience
              </SectionHeading>
              <ExperienceTimeline entries={profile.experience} />
            </section>
          )}

          {homeProjects.length > 0 && (
            <section aria-labelledby="projects">
              <SectionHeading
                id="projects"
                action={{ href: '/projects', label: 'All projects' }}
              >
                Projects
              </SectionHeading>
              <ProjectGrid projects={homeProjects} headingLevel={3} />
            </section>
          )}
        </div>
        <SiteFooter />
      </div>
    </div>
  )
}
