import {ImageResponse} from 'next/og'

import {diedAt, formatDate, lookFor} from '@/lib/graves'
import {OG_SIZE, OgGrave, ogFonts} from '@/lib/og'
import {allGraveSlugs, sanityFetch} from '@/sanity/lib/live'
import {GRAVE_OG_QUERY} from '@/sanity/lib/queries'

export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'A tombstone from the Bug Graveyard, with the bug’s name and epitaph'

export async function generateStaticParams() {
  return allGraveSlugs()
}

export default async function Image({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const {data: grave} = await sanityFetch({query: GRAVE_OG_QUERY, params: {slug}, stega: false})

  if (!grave) {
    return new ImageResponse(
      <OgGrave name="Nobody" epitaph="This grave is empty." dates="?" look="disturbed" details={[]} />,
      {...size, fonts: await ogFonts()},
    )
  }

  const look = lookFor({status: grave.status, disturbed: grave.disturbed})
  const died = formatDate(diedAt(grave)) ?? (look === 'zombie' ? 'still walking' : '?')
  const details = [
    [grave.language, grave.causeOfDeath].filter(Boolean).join(' · '),
    grave.risenFrom ? `Rose from “${grave.risenFrom}”` : look === 'disturbed' ? 'The grave is empty. It rose again.' : '',
  ].filter(Boolean)

  return new ImageResponse(
    <OgGrave
      name={grave.name}
      epitaph={grave.epitaph}
      dates={`${formatDate(grave.bornAt) ?? '?'} – ${died}`}
      look={look}
      details={details}
    />,
    {...size, fonts: await ogFonts()},
  )
}
