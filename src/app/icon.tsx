import { getProfile } from '@/lib/content'
import { renderMonogram } from '@/lib/og/monogram'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default async function Icon() {
  const { name } = await getProfile()
  return renderMonogram(name, size.width)
}
