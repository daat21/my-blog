import { describe, expect, it } from 'vitest'

import { photoDetails } from './photo-details'

describe('photoDetails', () => {
  it('lists location, camera, lens and exposure in that order', () => {
    expect(
      photoDetails({
        exposure: 'ƒ/8 · 1/500 s · ISO 100',
        lens: '35 mm ƒ/2',
        camera: 'Rangefinder R1',
        location: 'Exampleton',
      })
    ).toEqual([
      { label: 'Location', value: 'Exampleton' },
      { label: 'Camera', value: 'Rangefinder R1' },
      { label: 'Lens', value: '35 mm ƒ/2' },
      { label: 'Exposure', value: 'ƒ/8 · 1/500 s · ISO 100' },
    ])
  })

  it('leaves out the details a photo does not have', () => {
    expect(photoDetails({ lens: '90 mm ƒ/3.5' })).toEqual([
      { label: 'Lens', value: '90 mm ƒ/3.5' },
    ])
    expect(photoDetails({})).toEqual([])
  })
})
