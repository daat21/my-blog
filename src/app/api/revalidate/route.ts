import { revalidateTag } from 'next/cache'

import { handleRevalidation } from '@/lib/content/revalidate'
import { preflightCurrentContent } from '@/lib/content/runtime-source'
import { env } from '@/lib/env'

export async function POST(request: Request): Promise<Response> {
  return handleRevalidation(request, {
    secret: env.content.secret,
    repo: env.content.repo,
    ref: env.content.ref,
    preflight: preflightCurrentContent,
    expire: tag => {
      revalidateTag(tag, { expire: 0 })
    },
  })
}
