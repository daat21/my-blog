import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PhotoGrid } from './photo-grid'

describe('PhotoGrid', () => {
  it('shows an empty state when there are no photos', () => {
    const html = renderToStaticMarkup(<PhotoGrid album="empty" photos={[]} />)
    expect(html).toContain('No photos yet. Check back soon.')
    expect(html).not.toContain('<ul')
  })
})
