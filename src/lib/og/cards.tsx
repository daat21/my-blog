import { ImageResponse } from 'next/og'

import type { PostSummary, Profile } from '@/lib/content'
import { ogPalette } from '@/lib/og/palette'

/** The link-preview size most platforms expect. */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 }

const dateFormat = new Intl.DateTimeFormat('en', {
  dateStyle: 'long',
  timeZone: 'UTC',
})

interface TitleCardProps {
  /** Short line above the title, after the accent mark. */
  eyebrow: string
  title: string
  /** Muted line below the rule. */
  footer: string
}

// Satori (behind next/og) supports a subset of CSS: every element with more
// than one child needs display: flex. The default next/og font is used, so
// nothing is fetched at build time.
function titleCard({ eyebrow, title, footer }: TitleCardProps): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: ogPalette.canvas,
        color: ogPalette.fg,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          fontSize: 30,
          color: ogPalette.fgMuted,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: ogPalette.accent,
          }}
        />
        {eyebrow}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: title.length > 60 ? 56 : 68,
          lineHeight: 1.15,
          letterSpacing: -1.5,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: 'flex',
          paddingTop: 32,
          borderTop: `2px solid ${ogPalette.border}`,
          fontSize: 30,
          color: ogPalette.fgMuted,
        }}
      >
        {footer}
      </div>
    </div>,
    OG_IMAGE_SIZE
  )
}

/** The site-wide preview card: name, role and bio. */
export function renderSiteCard(profile: Profile): ImageResponse {
  return titleCard({
    eyebrow: profile.role,
    title: profile.name,
    footer: profile.bio,
  })
}

/** A post's preview card: site name, title and publication date. */
export function renderPostCard(
  post: PostSummary,
  siteName: string
): ImageResponse {
  return titleCard({
    eyebrow: siteName,
    title: post.title,
    footer: dateFormat.format(new Date(`${post.date}T00:00:00Z`)),
  })
}
