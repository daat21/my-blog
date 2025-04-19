'use client'

import { HorizontalCard } from '../pages/Cards'
import GlobeCard from './rencently-updates/GlobeCard'

export default function RecentlyUpdated() {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col rounded-lg border p-8">
        <h2 className="border-0 text-2xl md:mb-4 md:text-3xl">
          Recently Updated
        </h2>
        <div className="flex flex-col gap-8">
          <HorizontalCard />
          <HorizontalCard />
          <HorizontalCard />
        </div>
      </div>
      <GlobeCard />
    </div>
  )
}
