import {revalidateTag} from 'next/cache'
import type {NextRequest} from 'next/server'
import {parseBody} from 'next-sanity/webhook'

import {SANITY_CONTENT_TAG} from '@/sanity/lib/live'

// A Sanity webhook calls this whenever a bug, language or cause of death is
// published, edited or deleted, so the live site refreshes even when nobody has
// it or the Studio open. Requests must be signed with SANITY_REVALIDATE_SECRET.
export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) {
    return Response.json({message: 'SANITY_REVALIDATE_SECRET is not set'}, {status: 500})
  }

  // Also waits until the change is readable from Sanity's API, so the pages
  // rebuilt after this don't fetch the old content again.
  const {isValidSignature, body} = await parseBody<{_id: string; _type: string}>(request, secret)
  if (!isValidSignature) {
    return Response.json({message: 'Invalid signature'}, {status: 401})
  }

  // Expire immediately: the next visitor gets fresh content, never a stale copy.
  revalidateTag(SANITY_CONTENT_TAG, {expire: 0})
  return Response.json({revalidated: SANITY_CONTENT_TAG, document: body?._id ?? null})
}
