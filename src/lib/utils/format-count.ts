/** Formats an English count label, using the singular only for one. */
export function formatCount(count: number, singular: string) {
  return `${count} ${singular}${count === 1 ? '' : 's'}`
}
