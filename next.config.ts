import type { NextConfig } from 'next'

import { env } from './src/lib/env'
import {
  CONTENT_SECURITY_POLICY,
  CSP_HEADER_NAME,
} from './src/lib/security/csp'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  typedRoutes: true,
  // Runtime text and media fallback data are server-only build artifacts.
  outputFileTracingIncludes: {
    '/*': ['./.content-runtime/baseline.json', './.media/manifest.json'],
  },
  outputFileTracingExcludes: { '/*': ['./.content/**/*'] },
  poweredByHeader: false,
  // Dev server only: allow testing from a phone or tablet on the local network
  // or a Tailscale tailnet. Without this, the dev server blocks its scripts for
  // any hostname other than localhost and the page never becomes interactive.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '100.*.*.*', '*.local'],
  redirects() {
    return Promise.resolve([
      { source: '/blogs', destination: '/writing', permanent: true },
      { source: '/blogs/:slug*', destination: '/writing', permanent: true },
      ...[
        '/contact',
        '/profiles',
        '/login',
        '/signup',
        '/signup/confirm',
        '/forget_password',
        '/update_password',
        '/error',
        '/callback',
        '/confirm/reset_password',
        '/confirm/signup',
        '/signout',
      ].map(source => ({ source, destination: '/', permanent: true })),
    ])
  },
  headers() {
    return Promise.resolve([
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          // Omit CSP in next dev rather than weakening the production policy for HMR.
          ...(env.isDevelopment
            ? []
            : [{ key: CSP_HEADER_NAME, value: CONTENT_SECURITY_POLICY }]),
        ],
      },
      {
        // Processed media file names carry a content hash, so they never change.
        source: '/_media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ])
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
