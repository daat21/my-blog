import { ProjectsListSkeleton } from '@/components/pages/Skeleton'
import ProjectsList from '@/components/project/ProjectsList'
import { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Projects',
}

export default function ProjectsPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="border-0 text-2xl font-semibold md:mt-10 md:text-3xl">
        My Projects
      </h2>
      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 justify-items-center gap-8 md:grid-cols-3 md:gap-12">
        <Suspense fallback={<ProjectsListSkeleton />}>
          <ProjectsList />
        </Suspense>
      </div>
    </div>
  )
}
