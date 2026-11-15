import { SiteShell } from '@/components/layout/site-shell'
import { getProfile, listTags } from '@/lib/content'

/** How many of the most-used tags the sidebar lists. */
const SIDEBAR_TOPICS = 6

export default async function SiteLayout({ children }: LayoutProps<'/'>) {
  const [profile, tags] = await Promise.all([getProfile(), listTags()])

  return (
    <SiteShell profile={profile} topics={tags.slice(0, SIDEBAR_TOPICS)}>
      {children}
    </SiteShell>
  )
}
