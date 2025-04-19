import { CardSpotlight } from '@/components/ui/card-spotlight'

export function RecentlyViews() {
  return (
    <CardSpotlight className="flex items-center justify-center" radius={150}>
      <div className="text-muted-foreground relative gap-2 text-sm font-semibold">
        <p className="leading-6">My Status: 🟢 Online</p>
        <p className="leading-6">Last Seen: Apr 19, 2025, 23:08</p>
        <p className="leading-6">Views (Last 7 days): 21</p>
        <p className="leading-6">Total Views: 1998</p>
      </div>
    </CardSpotlight>
  )
}
