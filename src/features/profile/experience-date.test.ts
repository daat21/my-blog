import { describe, expect, it } from 'vitest'

import { formatExperienceDate } from './experience-date'

describe('formatExperienceDate', () => {
  it.each([
    ['2026-02', 'Feb 2026'],
    ['2021', '2021'],
    ['2026-01', 'Jan 2026'],
    ['2026-09', 'Sep 2026'],
    ['2026-10', 'Oct 2026'],
    ['2026-12', 'Dec 2026'],
    [undefined, 'Now'],
  ])('formats %s as %s', (date, expected) => {
    expect(formatExperienceDate(date)).toBe(expected)
  })
})
