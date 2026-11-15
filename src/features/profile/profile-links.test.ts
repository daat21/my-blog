import { describe, expect, it } from 'vitest'

import type { ProfileLink } from '@/lib/content'

import { findContactLink, findResumeLink } from './profile-links'

const code: ProfileLink = { label: 'Code', href: 'https://code.example.com' }
const email: ProfileLink = { label: 'Email', href: 'mailto:a@example.com' }

describe('findContactLink', () => {
  it('returns the first mailto: link', () => {
    const other = { label: 'Work', href: 'mailto:b@example.com' }
    expect(findContactLink([code, email, other])).toBe(email)
  })

  it('ignores the scheme’s case', () => {
    const upper = { label: 'Email', href: 'MAILTO:a@example.com' }
    expect(findContactLink([upper])).toBe(upper)
  })

  it('returns undefined without a mailto: link', () => {
    expect(findContactLink([code])).toBeUndefined()
  })
})

describe('findResumeLink', () => {
  it.each([
    'Résumé (PDF)',
    'Resume',
    'résumé',
    'CV',
    'My CV',
    'Curriculum Vitae',
  ])('matches %j', label => {
    const link = { label, href: '/resume.pdf' }
    expect(findResumeLink([code, link])).toBe(link)
  })

  it.each(['Code', 'Resumes are overrated', 'CVS receipts'])(
    'does not match %j',
    label => {
      expect(findResumeLink([{ label, href: '/x' }])).toBeUndefined()
    }
  )
})
