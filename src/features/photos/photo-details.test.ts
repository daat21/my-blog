import { describe, expect, it } from 'vitest'

import { photoDetails } from './photo-details'

describe('photoDetails', () => {
  it('omits missing fields', () => {
    expect(photoDetails({})).toEqual([])
    expect(photoDetails({ camera: 'R1', iso: '200' })).toEqual([
      { label: 'Camera', value: 'R1' },
      { label: 'ISO', value: '200' },
    ])
  })
  it('keeps parameters in display order', () => {
    expect(
      photoDetails({
        location: 'Bay',
        taken: '2026-01-01',
        camera: 'R1',
        lens: '35 mm',
        focalLength: '35 mm',
        aperture: 'ƒ/8',
        shutter: '1/500 s',
        iso: '100',
      }).map(detail => detail.label)
    ).toEqual([
      'Camera',
      'Lens',
      'Focal length',
      'Aperture',
      'Shutter',
      'ISO',
      'Taken',
      'Place',
    ])
  })
})
