'use server'

import {updateTag} from 'next/cache'
import {parseTags} from 'next-sanity/live'

// <SanityLive />'s default action calls revalidateTag(tag, 'max') in production,
// which serves the old page once more while it rebuilds, so an open tab's refresh
// still shows the previous content. updateTag expires the tags immediately.
export async function expireSanityTags(unsafeTags: unknown) {
  const {tags} = parseTags(unsafeTags)
  for (const tag of tags) updateTag(tag)
  return 'refresh' as const
}
