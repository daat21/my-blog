import { RightSide } from './rencently-updates/RightSide'
import { MyProjects } from './rencently-updates/MyProjects'
import { RecentlyBlogs } from './rencently-updates/RecentlyBlogs'

export default function RecentlyUpdated() {
  return (
    <div className="flex flex-col gap-4">
      <div className="md:flex md:gap-4">
        <RecentlyBlogs />
        <RightSide />
      </div>
      <MyProjects />
    </div>
  )
}
