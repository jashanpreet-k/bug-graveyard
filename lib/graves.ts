import type {TombstoneLook} from '@/components/Tombstone'
import {BUG_STATUSES} from '@/sanity/lib/statuses'

// Which stone a bug gets: a walking zombie glows, a grave whose bug has risen is
// dug up, a grave that a new bug might be rising from is haunted, and everything
// else rests.
export function lookFor({status, disturbed, haunted}: {status: string; disturbed?: boolean; haunted?: boolean}): TombstoneLook {
  if (status === 'zombie') return 'zombie'
  if (disturbed) return 'disturbed'
  if (haunted) return 'haunted'
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

export type StoneShape = 'dome' | 'tall' | 'flat' | 'low'

export type StoneStyle = {shape: StoneShape; height: number; width: number; tilt: number}

// A little variety per grave so the graveyard looks natural. It comes from a hash
// of the bug's ID, so a grave always gets the same stone and nothing jumps on reload.
export function stoneStyleFor(id: string): StoneStyle {
  let hash = 2166136261 // FNV-1a
  for (const char of id) hash = Math.imul(hash ^ char.codePointAt(0)!, 16777619) >>> 0
  const pick = <T,>(options: readonly T[], shift: number) => options[(hash >>> shift) % options.length]
  return {
    shape: pick(['dome', 'tall', 'flat', 'low'] as const, 0),
    height: pick([-1.5, -0.75, 0, 0.75, 1.5], 5), // rem added to the regular height
    width: pick([17, 17.5, 18, 18.5], 10), // rem
    tilt: pick([-1.2, -0.6, 0, 0.6, 1.2], 15), // degrees, resting stones only
  }
}

export type TimelineEvent = {
  key: string
  icon: string
  title: string
  date: string | null
  detail?: string
  href?: string
  /** This grave's own events, as opposed to its past lives and zombies */
  current?: boolean
}

type TimelineLife = Life & {slug: string}

// A bug's whole life as one list, oldest first: born → fix merged → buried → rose
// again as its zombie → …, along the previousLife chain, then any zombies that rose
// from this grave, and a pending haunting. Built from data the page already has.
export function timelineOf({
  pastLives,
  hasOlderLives,
  grave,
  risen,
  haunting,
}: {
  pastLives: TimelineLife[]
  hasOlderLives: boolean
  grave: TimelineLife
  risen: TimelineLife[]
  haunting: {name: string; matchScore: number | null; reportedAt: string | null; isExample: boolean} | null
}) {
  const events: TimelineEvent[] = []
  if (hasOlderLives) events.push({key: 'older', icon: '⋯', title: 'Earlier lives', date: null, detail: 'This bug died more times than shown here.'})
  const lives = [...pastLives, grave]
  lives.forEach((life, index) => {
    const current = life === grave
    const href = current ? undefined : `/grave/${life.slug}`
    events.push(
      index === 0 && !hasOlderLives
        ? {key: `${life.slug}-born`, icon: '🐛', title: `Born as “${life.name}”`, date: life.bornAt, href, current}
        : {key: `${life.slug}-born`, icon: '🧟', title: `Rose again as “${life.name}”`, date: life.bornAt, href, current},
    )
    if (life.fixMergedAt) events.push({key: `${life.slug}-fix`, icon: '🩹', title: 'Fix merged', date: life.fixMergedAt, current})
    if (life.buriedAt) events.push({key: `${life.slug}-buried`, icon: '🪦', title: 'Buried', date: life.buriedAt, current})
  })
  for (const zombie of risen) {
    events.push({key: `${zombie.slug}-rose`, icon: '🧟', title: `Rose again as “${zombie.name}”`, date: zombie.bornAt, href: `/grave/${zombie.slug}`})
  }
  if (haunting) {
    events.push({
      key: 'haunted',
      icon: '👻',
      title: 'Haunted',
      date: haunting.reportedAt,
      detail: `“${haunting.name}” was ${haunting.isExample ? 'sent as an example' : 'reported'} and might be this bug coming back (match score ${haunting.matchScore ?? '?'} from 4 signals). ${haunting.isExample ? 'Examples are dismissed automatically after an hour.' : 'The graveyard keeper will confirm it.'}`,
      current: true,
    })
  } else if (grave.status === 'zombie' && !grave.fixMergedAt) {
    events.push({key: 'walking', icon: '🧟', title: 'Still walking', date: null, current: true})
  }
  return events
}
