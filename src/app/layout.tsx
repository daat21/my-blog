import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'

import { ThemeScript } from '@/components/layout/theme-script'
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

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: 'Daming Chen',
  description:
    'Personal site and blog of Daming Chen, a web developer in Adelaide.',
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
