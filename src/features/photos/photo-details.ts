import type { PhotoSummary } from '@/lib/content'

export interface PhotoDetail {
  /** Read out before the value, which carries no label on screen. */
  label: string
  value: string
}

const FIELDS = [
  ['location', 'Location'],
  ['camera', 'Camera'],
  ['lens', 'Lens'],
  ['exposure', 'Exposure'],
] as const

/** The optional details a photo has, in display order. */
export function photoDetails(
  photo: Pick<PhotoSummary, (typeof FIELDS)[number][0]>
): PhotoDetail[] {
  return FIELDS.flatMap(([key, label]) => {
    const value = photo[key]
    return value === undefined ? [] : [{ label, value }]
  })
}
