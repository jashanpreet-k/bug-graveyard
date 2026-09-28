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
