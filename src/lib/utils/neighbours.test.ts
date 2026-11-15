import { describe, expect, it } from 'vitest'

import { findNeighbours } from './neighbours'

// Newest first, as the content lists return them.
const posts = [{ slug: 'newest' }, { slug: 'middle' }, { slug: 'oldest' }]

describe('findNeighbours', () => {
  it('returns the older post as previous and the newer one as next', () => {
    expect(findNeighbours(posts, 'middle')).toEqual({
      previous: { slug: 'oldest' },
      next: { slug: 'newest' },
    })
  })

  it('has no next post for the newest and no previous for the oldest', () => {
    expect(findNeighbours(posts, 'newest')).toEqual({
      previous: { slug: 'middle' },
      next: undefined,
    })
    expect(findNeighbours(posts, 'oldest')).toEqual({
      previous: undefined,
      next: { slug: 'middle' },
    })
  })

  it('is empty for a slug that is not listed', () => {
    expect(findNeighbours(posts, 'missing')).toEqual({})
    expect(findNeighbours([{ slug: 'only' }], 'only')).toEqual({
      previous: undefined,
      next: undefined,
    })
  })
})
