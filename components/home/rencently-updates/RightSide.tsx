import GlobeCard from './GlobeCard'
import { RecentlyViews } from './RecentlyViews'

export function RightSide() {
  return (
    <div className="mt-4 flex flex-col gap-4 md:mt-0 md:w-4/9">
      <GlobeCard />
      <RecentlyViews />
    </div>
  )
}
