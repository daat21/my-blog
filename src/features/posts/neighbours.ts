export interface Neighbours<T> {
  /** The next older post. */
  previous?: T
  /** The next newer post. */
  next?: T
}

/**
 * The posts either side of `slug` in a newest-first list: `previous` is the
 * older one and `next` the newer one. Empty when `slug` is not in the list.
 */
export function findNeighbours<T extends { slug: string }>(
  posts: readonly T[],
  slug: string
): Neighbours<T> {
  const index = posts.findIndex(post => post.slug === slug)
  if (index === -1) return {}
  return { previous: posts[index + 1], next: posts[index - 1] }
}
