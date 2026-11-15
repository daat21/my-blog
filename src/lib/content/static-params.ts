/**
 * With Cache Components, `generateStaticParams` must return at least one
 * entry, or the build fails. An empty collection (no posts yet, no tags yet)
 * therefore returns this placeholder instead. It is not a valid slug, so
 * content lookups for it miss and the route responds with a 404.
 */
export const PLACEHOLDER_PARAM = '__placeholder__'

/**
 * Turns values into static params for a dynamic segment named `key`, falling
 * back to the placeholder when there are none.
 */
export function staticParams<K extends string>(
  key: K,
  values: readonly string[]
): Record<K, string>[] {
  const list = values.length > 0 ? values : [PLACEHOLDER_PARAM]
  return list.map(value => ({ [key]: value }) as Record<K, string>)
}
