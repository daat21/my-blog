import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'

import { ThemeScript } from '@/components/layout/theme-script'
import { getProfile } from '@/lib/content'
import { env } from '@/lib/env'
import { cn } from '@/lib/utils'

import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

export async function generateMetadata(): Promise<Metadata> {
  const { name, bio } = await getProfile()

  return {
    metadataBase: new URL(env.siteUrl),
    title: { template: `%s · ${name}`, default: name },
    description: bio,
    openGraph: { siteName: name, locale: 'en', type: 'website' },
    twitter: { card: 'summary_large_image' },
    alternates: {
      types: { 'application/rss+xml': [{ url: '/rss.xml', title: name }] },
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      // The theme script sets data-theme before hydration.
      suppressHydrationWarning
      className={cn(inter.variable, jetbrainsMono.variable)}
    >
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  )
}
