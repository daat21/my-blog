import type { PhotoSummary } from '@/lib/content'

export interface PhotoDetail {
  label: string
  value: string
}

const FIELDS = [
  ['camera', 'Camera'],
  ['lens', 'Lens'],
  ['focalLength', 'Focal length'],
  ['aperture', 'Aperture'],
  ['shutter', 'Shutter'],
  ['iso', 'ISO'],
  ['taken', 'Taken'],
  ['location', 'Place'],
] as const

/** Filled shooting parameters in display order, never empty placeholders. */
export function photoDetails(
  photo: Pick<PhotoSummary, (typeof FIELDS)[number][0]>
): PhotoDetail[] {
  return FIELDS.flatMap(([key, label]) => {
    const value = photo[key]
    return value === undefined ? [] : [{ label, value }]
  })
}
