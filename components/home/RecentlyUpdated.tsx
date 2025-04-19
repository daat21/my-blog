'use client'

import { HorizontalCard } from '../pages/Cards'
import GlobeCard from './rencently-updates/GlobeCard'
import { RecentlyViews } from './rencently-updates/RecentlyViews'
import { MyProjects } from './rencently-updates/MyProjects'

export default function RecentlyUpdated() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="flex h-[562px] flex-col rounded-lg border p-8">
          <h2 className="border-0 text-xl md:mb-4 md:text-2xl">
            Recently Updated
          </h2>
          <div className="flex flex-col gap-8">
            <HorizontalCard />
            <HorizontalCard />
            <HorizontalCard />
          </div>
        </div>
        <div className="flex w-4/9 flex-col gap-4">
          <GlobeCard />
          <RecentlyViews />
        </div>
      </div>
      <MyProjects />
    </div>
  )
}
