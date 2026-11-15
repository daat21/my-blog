import { getProfile } from '@/lib/content'
import { renderMonogram } from '@/lib/og/monogram'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  const { name } = await getProfile()
  return renderMonogram(name, size.width)
}
