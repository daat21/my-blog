import { getProfile } from '@/lib/content'
import { OG_IMAGE_SIZE, renderSiteCard } from '@/lib/og/cards'

export const alt = 'Title card with the author’s name and role'
export const size = OG_IMAGE_SIZE
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  return renderSiteCard(await getProfile())
}
