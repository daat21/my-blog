import { getProfile, listPosts, staticParams } from '@/lib/content'
import { OG_IMAGE_SIZE, renderPostCard } from '@/lib/og/cards'

export const alt = 'Title card with the post’s title and date'
export const size = OG_IMAGE_SIZE
export const contentType = 'image/png'

// This route handler is separate from the post page, so it lists its own
// params; with them, every card is prerendered at build time.
export async function generateStaticParams() {
  const posts = await listPosts()
  return staticParams(
    'slug',
    posts.map(({ slug }) => slug)
  )
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const [{ slug }, profile, posts] = await Promise.all([
    params,
    getProfile(),
    listPosts(),
  ])
  const post = posts.find(candidate => candidate.slug === slug)
  if (!post) return new Response('Not found', { status: 404 })
  return renderPostCard(post, profile.name)
}
