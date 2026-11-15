import type { PhotoSummary } from '@/lib/content'

import { photoDetails } from './photo-details'

interface PhotoMetaProps {
  photo: Pick<
    PhotoSummary,
    'date' | 'location' | 'camera' | 'lens' | 'exposure'
  >
}

/**
 * A mono row: the date, then location, camera, lens and exposure, each only
 * when the photo has it. Labels are for assistive technology only.
 */
export function PhotoMeta({ photo }: PhotoMetaProps) {
  return (
    <ul
      aria-label="Photo details"
      className="flex flex-wrap items-center gap-x-3.5 gap-y-2 font-mono text-meta text-fg-muted"
    >
      <li>
        <span className="sr-only">Date: </span>
        <time dateTime={photo.date}>{photo.date}</time>
      </li>
      {photoDetails(photo).map(({ label, value }) => (
        <li key={label} className="flex items-center gap-x-3.5">
          <span aria-hidden="true">·</span>
          <span>
            <span className="sr-only">{label}: </span>
            {value}
          </span>
        </li>
      ))}
    </ul>
  )
}
