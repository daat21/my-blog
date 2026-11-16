import type { PhotoSummary } from '@/lib/content'

import { photoDetails } from './photo-details'

/** Parameters are stacked below full tier and label/value columns on desktop. */
export function PhotoMeta({ photo }: { photo: PhotoSummary }) {
  const details = photoDetails(photo)
  if (details.length === 0) return null
  return (
    <dl
      aria-label="Photo parameters"
      className="border-t border-border font-mono"
    >
      {details.map(({ label, value }) => (
        <div
          key={label}
          className="grid gap-1 border-b border-border py-3 xl:grid-cols-[7rem_minmax(0,1fr)] xl:gap-3"
        >
          <dt className="text-label tracking-widest text-fg-muted uppercase">
            {label}
          </dt>
          <dd className="text-sm wrap-anywhere text-fg">
            {label === 'Taken' ? (
              <time dateTime={value.replace(' ', 'T')}>
                {value.replace(' ', ' · ')}
              </time>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
