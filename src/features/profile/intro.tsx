import { ButtonLink } from '@/components/ui/button'
import type { Profile, ProfileLink } from '@/lib/content'

import { findContactLink, findResumeLink } from './profile-links'

interface IntroProps {
  intro: Profile['intro']
  links: readonly ProfileLink[]
}

/**
 * The home page's opening: a two-tone heading, a few paragraphs and calls to
 * action. A button whose link the profile lacks is left out.
 */
export function Intro({ intro, links }: IntroProps) {
  const contact = findContactLink(links)
  const resume = findResumeLink(links)

  return (
    <section aria-labelledby="intro" className="flex flex-col gap-6">
      <h1
        id="intro"
        className="text-display font-medium tracking-[-0.022em] text-pretty text-fg"
      >
        {intro.headline} <span className="text-fg-muted">{intro.detail}</span>
      </h1>
      {intro.paragraphs.length > 0 && (
        <div className="flex max-w-155 flex-col gap-4 text-body">
          {intro.paragraphs.map((paragraph, index) => (
            // Paragraphs have no identity of their own and never reorder.
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}
      {(contact ?? resume) && (
        <div className="flex flex-wrap gap-3">
          {contact && <ButtonLink href={contact.href}>Get in touch</ButtonLink>}
          {resume && (
            <ButtonLink href={resume.href} variant="secondary">
              {resume.label}
            </ButtonLink>
          )}
        </div>
      )}
    </section>
  )
}
