export interface Neighbours<T> {
  /** The next older item. */
  previous?: T
  /** The next newer item. */
  next?: T
}

/**
 * The items either side of `slug` in a newest-first list: `previous` is the
 * older one and `next` the newer one. Empty when `slug` is not in the list.
 */
export function findNeighbours<T extends { slug: string }>(
  items: readonly T[],
  slug: string
): Neighbours<T> {
  const index = items.findIndex(item => item.slug === slug)
  if (index === -1) return {}
  return { previous: items[index + 1], next: items[index - 1] }
}
