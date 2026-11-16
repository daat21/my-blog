import type { ProfileLink } from '@/lib/content'

const MAILTO = /^mailto:/i
const RESUME_LABEL = /\b(?:resume|cv|curriculum vitae)\b/i

function withoutAccents(text: string): string {
  return text.normalize('NFKD').replace(/\p{M}/gu, '')
}

/** The first `mailto:` link, the target of "Get in touch". */
export function findContactLink(
  links: readonly ProfileLink[]
): ProfileLink | undefined {
  return links.find(link => MAILTO.test(link.href))
}

/** The first link labelled like "Résumé", "Resume" or "CV". */
export function findResumeLink(
  links: readonly ProfileLink[]
): ProfileLink | undefined {
  return links.find(link => RESUME_LABEL.test(withoutAccents(link.label)))
}
