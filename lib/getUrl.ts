import { headers } from 'next/headers'

export function getBaseUrl(request: Request, origin: string) {
  const forwardedHost = request.headers.get('x-forwarded-host')

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (forwardedHost && process.env.NODE_ENV !== 'development') {
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    return `${protocol}://${forwardedHost}`
  }

  return origin
}

export async function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  const headerOrigin = (await headers()).get('origin')
  if (headerOrigin) {
    return headerOrigin
  }

  return process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://your-production-domain.com'
}
