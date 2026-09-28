import {expireSanityTags} from '@/sanity/lib/actions'
import {SanityLive} from '@/sanity/lib/live'

// The site's pages stay cached until <SanityLive /> sees a content change, and it
// only sees changes while a page with it is open. Listening here too means that
// publishing in the Studio refreshes the site even when no site tab is open.
export default function StudioLayout({children}: {children: React.ReactNode}) {
  return (
    <>
      {children}
      <SanityLive action={expireSanityTags} />
    </>
  )
}
