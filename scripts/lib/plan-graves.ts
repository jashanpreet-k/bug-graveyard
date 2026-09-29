// Turns content/graves.ts into Sanity documents, and explains anything wrong with
// it. Pure: it reads no data and writes nothing, so it's easy to test.
import type {GraveEntry} from '../../content/types'
import {BURIAL_WAIT_DAYS, daysBetween} from '../../sanity/lib/lifecycle'
import {BUG_STATUSES} from '../../sanity/lib/statuses'
import {EPITAPH_MAX_LENGTH} from '../../sanity/lib/epitaph'

export const GRAVE_ID_PREFIX = 'grave-'

export const graveId = (key: string) => `${GRAVE_ID_PREFIX}${key}`

export type Lookups = {
  languages: {_id: string; name: string}[]
  causes: {_id: string; title: string}[]
  /** Every bug's slug, so an imported grave can't take one already in use. */
  slugs: {_id: string; slug: string}[]
}

export type BugDocument = {_id: string; _type: 'bug'; name: string} & Record<string, unknown>

const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const STATUSES: readonly string[] = BUG_STATUSES.map((status) => status.value)
const SEVERITIES = ['low', 'medium', 'critical']
const ref = (_ref: string) => ({_type: 'reference', _ref})

export function planGraves(entries: GraveEntry[], lookups: Lookups) {
  const problems: string[] = []
  const report = (entry: GraveEntry, index: number, message: string) =>
    problems.push(`${entry.key ? `"${entry.key}"` : `entry ${index + 1}`}: ${message}`)

  const languages = byName(lookups.languages.map((l) => [l.name, l._id]))
  const causes = byName(lookups.causes.map((c) => [c.title, c._id]))
  const entriesByKey = new Map<string, GraveEntry>()
  const risenFrom = new Map<string, string>()

  // Each entry on its own
  entries.forEach((entry, index) => {
    const problem = (message: string) => report(entry, index, message)

    if (!KEY.test(entry.key ?? '')) problem('key must be lowercase words joined by hyphens, e.g. "stale-cache"')
    else if (entriesByKey.has(entry.key)) problem('this key is used by another entry too')
    else entriesByKey.set(entry.key, entry)

    if (!entry.name?.trim()) problem('name is missing')
    if (!STATUSES.includes(entry.status)) problem(`status must be one of ${list(STATUSES)}`)
    if (entry.severity !== undefined && !SEVERITIES.includes(entry.severity)) {
      problem(`severity must be one of ${list(SEVERITIES)}`)
    }
    if (!languages.get(normalize(entry.language))) {
      problem(`unknown language "${entry.language}" (known: ${list(lookups.languages.map((l) => l.name))})`)
    }
    if (!causes.get(normalize(entry.cause))) {
      problem(`unknown cause of death "${entry.cause}" (known: ${list(lookups.causes.map((c) => c.title))})`)
    }
    if (entry.epitaph && entry.epitaph.length > EPITAPH_MAX_LENGTH) {
      problem(`epitaph is ${entry.epitaph.length} characters; the most is ${EPITAPH_MAX_LENGTH}`)
    }
    if (entry.component !== undefined && (entry.component.trim() === '' || entry.component.length > 40)) {
      problem('component must be 1 to 40 characters')
    }
    if (entry.symptoms !== undefined && entry.symptoms.length > 500) {
      problem(`symptoms is ${entry.symptoms.length} characters; the most is 500`)
    }
    if (entry.fixUrl !== undefined && !/^https?:\/\/\S+$/.test(entry.fixUrl)) {
      problem('fixUrl must be an http or https address')
    }
    if (entry.hoursToKill !== undefined && !(Number.isFinite(entry.hoursToKill) && entry.hoursToKill >= 0)) {
      problem('hoursToKill must be a number, 0 or more')
    }

    const dates = (['bornAt', 'fixMergedAt', 'buriedAt'] as const).filter((field) => entry[field] !== undefined)
    for (const field of dates) {
      if (!isDate(entry[field])) problem(`${field} must be a real date written "YYYY-MM-DD"`)
    }
    const inOrder = dates.filter((field) => isDate(entry[field]))
    for (let i = 1; i < inOrder.length; i++) {
      if (entry[inOrder[i]]! < entry[inOrder[i - 1]]!) problem(`${inOrder[i]} is before ${inOrder[i - 1]}`)
    }
    // The same rule as the Studio's "Declare buried" action.
    if (isDate(entry.fixMergedAt) && isDate(entry.buriedAt)) {
      const held = daysBetween(entry.fixMergedAt!, entry.buriedAt!)
      if (held >= 0 && held < BURIAL_WAIT_DAYS) {
        problem(`buriedAt is ${held} days after fixMergedAt; a fix must hold ${BURIAL_WAIT_DAYS} days before burial`)
      }
    }

    const clash = lookups.slugs.find((s) => s.slug === entry.key && s._id !== graveId(entry.key))
    if (clash) problem(`another bug (${clash._id}) already lives at /grave/${entry.key}; pick a different key`)

    if (entry.status === 'zombie' && !entry.risesFrom) {
      problem('status "zombie" needs risesFrom: a zombie always rose from an earlier grave')
    }
  })

  // Zombie chains
  entries.forEach((entry, index) => {
    if (!entry.risesFrom) return
    const problem = (message: string) => report(entry, index, message)
    const grave = entriesByKey.get(entry.risesFrom)

    if (entry.risesFrom === entry.key) problem('a bug can’t rise from its own grave')
    else if (!grave) problem(`risesFrom "${entry.risesFrom}" isn’t the key of any entry`)
    else if (grave.status !== 'fix-merged' && grave.status !== 'buried') {
      problem(`"${grave.key}" is ${grave.status}; only a fix-merged or buried bug can rise again`)
    } else if (risenFrom.has(grave.key)) {
      problem(`"${grave.key}" already rose as "${risenFrom.get(grave.key)}"; a grave rises only once, so chain from that zombie instead`)
    } else {
      risenFrom.set(grave.key, entry.key)
      // A regression can't come back before the fix it regressed.
      if (isDate(entry.bornAt) && isDate(grave.fixMergedAt) && entry.bornAt! < grave.fixMergedAt!) {
        problem(`bornAt ${entry.bornAt} is before "${grave.key}" had its fix merged (${grave.fixMergedAt})`)
      }
    }
  })

  // How many times each bug has come back: the length of its chain.
  const timesResurrected = new Map<string, number>()
  for (const entry of entriesByKey.values()) {
    const seen = new Set([entry.key])
    let depth = 0
    for (let at = entry; at.risesFrom && entriesByKey.has(at.risesFrom); at = entriesByKey.get(at.risesFrom)!) {
      if (seen.has(at.risesFrom)) {
        problems.push(`"${entry.key}": its risesFrom chain loops back on itself (${[...seen, at.risesFrom].join(' → ')})`)
        break
      }
      seen.add(at.risesFrom)
      depth++
    }
    timesResurrected.set(entry.key, depth)
  }

  if (problems.length > 0) return {documents: [], problems: [...new Set(problems)]}

  const documents: BugDocument[] = entries.map((entry) => ({
    _id: graveId(entry.key),
    _type: 'bug',
    name: entry.name.trim(),
    slug: {_type: 'slug', current: entry.key},
    status: entry.status,
    language: ref(languages.get(normalize(entry.language))!),
    causeOfDeath: ref(causes.get(normalize(entry.cause))!),
    timesResurrected: timesResurrected.get(entry.key) ?? 0,
    ...(entry.risesFrom && {previousLife: ref(graveId(entry.risesFrom))}),
    ...pick(entry, [
      'severity',
      'epitaph',
      'killedBy',
      'hoursToKill',
      'bornAt',
      'fixMergedAt',
      'buriedAt',
      'component',
      'symptoms',
      'fixSummary',
      'fixUrl',
    ]),
  }))
  return {documents, problems}
}

// Names match case-insensitively and ignore stray spaces: "typescript " finds "TypeScript".
const normalize = (name: string | undefined) => (name ?? '').trim().toLowerCase()
const byName = (pairs: string[][]) => new Map(pairs.map(([name, id]) => [normalize(name), id]))
const list = (items: readonly string[]) => items.map((item) => `"${item}"`).join(', ')

// "2026-02-30" has the right shape but isn't a day, so check it round-trips.
function isDate(value: string | undefined) {
  if (!value || !DATE.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

function pick<T extends object, K extends keyof T>(object: T, keys: K[]) {
  return Object.fromEntries(keys.filter((key) => object[key] !== undefined).map((key) => [key, object[key]]))
}
