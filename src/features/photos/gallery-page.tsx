import { PAGE_GUTTER, WIDE_COLUMN } from '@/components/layout/page-gutter'
import { SiteFooter } from '@/components/layout/site-footer'
import { PageHeader } from '@/components/ui/page-header'
import { listPhotos } from '@/lib/content'

import { PhotoGrid } from './photo-grid'
import { PHOTOS_INTRO } from './photos-intro'

/** Every photo, newest first, below the page heading. */
export async function GalleryPage() {
  const photos = await listPhotos()

  return (
    <div className={PAGE_GUTTER}>
      <div className={WIDE_COLUMN}>
        <PageHeader
          title={PHOTOS_INTRO.title}
          description={PHOTOS_INTRO.description}
          className="max-w-172.5"
        />
        <PhotoGrid photos={photos} />
        <SiteFooter />
      </div>
    </div>
  )
}
