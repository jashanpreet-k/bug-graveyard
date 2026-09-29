import type {TombstoneLook} from '@/components/Tombstone'
import {BUG_STATUSES} from '@/sanity/lib/statuses'

// Which stone a bug gets: a walking zombie glows, a grave whose bug has risen is
// dug up, and everything else rests.
export function lookFor({status, disturbed}: {status: string; disturbed?: boolean}): TombstoneLook {
  if (status === 'zombie') return 'zombie'
  if (disturbed) return 'disturbed'
  return 'resting'
}

// A bug died when it was buried, or failing that when its fix was merged.
export function diedAt(bug: {buriedAt: string | null; fixMergedAt: string | null}) {
  return bug.buriedAt ?? bug.fixMergedAt
}

export function statusLabel(status: string) {
  const match = BUG_STATUSES.find((s) => s.value === status)
  return match ? `${match.emoji} ${match.title}` : status
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

// Sanity dates are "YYYY-MM-DD", which JavaScript reads as UTC midnight. Format
// them in UTC too, or anyone west of Greenwich sees every bug die a day early.
export function formatDate(date?: string | null) {
  return date ? dateFormat.format(new Date(date)) : null
}

type Life = {
  name: string
  slug: string
  epitaph: string | null
  status: string
  bornAt: string | null
  fixMergedAt: string | null
  buriedAt: string | null
}

type ThreeLivesBack = {
  previousLife: (Life & {previousLife: (Life & {previousLife: (Life & {hasOlderLives: boolean}) | null}) | null}) | null
}

// The previous lives a query fetched (it goes three back), oldest first, and
// whether the chain goes back further than that.
export function pastLivesOf(bug: ThreeLivesBack) {
  const one = bug.previousLife
  const two = one?.previousLife
  const three = two?.previousLife
  return {
    lives: [three, two, one].filter((life): life is NonNullable<typeof life> => life != null) as Life[],
    hasOlderLives: three?.hasOlderLives ?? false,
  }
}
