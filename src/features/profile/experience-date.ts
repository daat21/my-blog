const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

/** Formats a validated experience date without timezone or locale dependence. */
export function formatExperienceDate(date?: string): string {
  if (date === undefined) return 'Now'
  const [year, month] = date.split('-')
  return month === undefined ? date : `${MONTHS[Number(month) - 1]} ${year}`
}
