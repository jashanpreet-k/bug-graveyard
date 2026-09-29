import type {Metadata} from 'next'

export const SITE_NAME = 'Bug Graveyard'
export const SITE_DESCRIPTION =
  'Where fixed bugs are laid to rest, and where the ones that come back rise as zombies.'
export const REPO_URL = 'https://github.com/jashanpreet-k/bug-graveyard'

// Vercel sets this at build time, so share images get absolute production URLs.
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000'

// Next.js merges metadata shallowly: a page that sets openGraph replaces its
// parent's whole openGraph object, so every page builds a complete one here.
export function openGraph(title: string, description: string): Metadata['openGraph'] {
  return {title, description, siteName: SITE_NAME, type: 'website', locale: 'en'}
}
