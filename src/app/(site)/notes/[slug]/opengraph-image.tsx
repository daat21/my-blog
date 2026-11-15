import { getProfile, listPosts } from '@/lib/content'
import { OG_IMAGE_SIZE, renderPostCard } from '@/lib/og/cards'

export const alt = 'Title card with the note’s title and date'
export const size = OG_IMAGE_SIZE
export const contentType = 'image/png'

// This route handler is separate from the note page, so it lists its own
// params; with them, every card is prerendered at build time.
export async function generateStaticParams() {
  const notes = await listPosts({ collection: 'notes' })
  return notes.map(({ slug }) => ({ slug }))
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const [{ slug }, profile, notes] = await Promise.all([
    params,
    getProfile(),
    listPosts({ collection: 'notes' }),
  ])
  const note = notes.find(candidate => candidate.slug === slug)
  if (!note) return new Response('Not found', { status: 404 })
  return renderPostCard(note, profile.name)
}
