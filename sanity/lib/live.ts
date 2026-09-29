// Querying with "sanityFetch" will keep content automatically updated
// Before using it, import and render "<SanityLive />" in your layout, see
// https://github.com/sanity-io/next-sanity#live-content-api for more information.
import { defineLive } from "next-sanity/live";
import { client } from './client'
import { GRAVE_SLUGS_QUERY } from './queries'

/** Added to every sanityFetch, so the webhook can expire all Sanity content at once. */
export const SANITY_CONTENT_TAG = 'sanity-content'

const live = defineLive({
  client,
});

export const SanityLive = live.SanityLive

// <SanityLive /> only catches changes made while someone has the site or Studio
// open. For everything else, the Sanity webhook (app/api/revalidate) expires
// SANITY_CONTENT_TAG, so every fetch carries it on top of its own sync tags.
export const sanityFetch = ((options: Parameters<typeof live.sanityFetch>[0]) =>
  live.sanityFetch({
    ...options,
    tags: [SANITY_CONTENT_TAG, ...(options.tags ?? [])],
  })) as typeof live.sanityFetch

// Every grave's slug, for generateStaticParams. Always fetched fresh: a cached
// list would make the build prerender graves that no longer exist, and miss
// new ones (the local build cache is never told about content changes).
export async function allGraveSlugs() {
  return client.fetch(GRAVE_SLUGS_QUERY, {}, {cache: 'no-store', perspective: 'published'})
}
