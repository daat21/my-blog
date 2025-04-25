import { RightSide } from './rencently-updates/RightSide'
import { MyProjects } from './rencently-updates/MyProjects'
import { RecentlyBlogs } from './rencently-updates/RecentlyBlogs'
import { Suspense } from 'react'
import { RecentlyBlogsSkeleton, MyProjectsSkeleton } from '../pages/Skeleton'

export default function RecentlyUpdated() {
  return (
    <div className="flex flex-col gap-4">
      <div className="md:flex md:gap-4">
        <Suspense fallback={<RecentlyBlogsSkeleton />}>
          <RecentlyBlogs />
        </Suspense>
        <RightSide />
      </div>
      <Suspense fallback={<MyProjectsSkeleton />}>
        <MyProjects />
      </Suspense>
    </div>
  )
}
