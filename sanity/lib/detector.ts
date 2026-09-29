// The Zombie Detector: "Is this new bug actually an old one coming back?"
//
// It compares a new bug with every grave that could rise again, using four
// signals anyone can check, and adds them up into a match score. No AI decides
// the match; an Agent Action only writes a sentence explaining a match that has
// already passed the threshold.
//
//   match score = 25 × same cause of death
//               + 15 × same language
//               + 25 × same component
//               + 35 × min(shared keywords, 4) / 4      (rounded to a whole number)
//
// The four weights add up to 100. A possible resurrection needs MATCH_THRESHOLD.
// Keywords are the words of a bug's name and symptoms, lowercased, without common
// words, with plural and -ed/-ing endings trimmed, and with two aliases (DST, TZ).

export const MATCH_THRESHOLD = 60
export const WEIGHTS = {cause: 25, language: 15, component: 25, keywords: 35} as const
/** Shared keywords that earn the full keyword points. */
export const FULL_KEYWORDS = 4

export const MATCH_CANDIDATE = 'candidate'
export const MATCH_NONE = 'none'
export const MATCH_CONFIRMED = 'confirmed'
export const MATCH_DISMISSED = 'dismissed'

export const MATCH_STATUSES = [
  {title: '👻 Possible resurrection: waiting for a person', value: MATCH_CANDIDATE},
  {title: 'No known ghosts: a new bug', value: MATCH_NONE},
  {title: '🧟 Confirmed: it rose again', value: MATCH_CONFIRMED},
  {title: '✖ Dismissed: a new bug', value: MATCH_DISMISSED},
] as const

/** What the detector knows about a bug, new or buried. */
export interface DetectorBug {
  _id: string
  name: string | null
  causeId: string | null
  cause: string | null
  languageId: string | null
  language: string | null
  component: string | null
  symptoms: string | null
}

export interface MatchSignal {
  _key: string
  signal: 'cause' | 'language' | 'component' | 'keywords'
  label: string
  matched: boolean
  detail: string
  points: number
}

export interface Match {
  grave: DetectorBug
  score: number
  signals: MatchSignal[]
  sharedKeywords: string[]
}

const STOP_WORDS = new Set(
  `a an and are as at be been but by can could did do does for from had has have how if in into is it its
  just like me my no not of on once or our out over so some than that the their them then there these they
  this those through to too up us very was we were what when where which while who why will with would you
  your after again all also any back bug bugs came come every fixed fix get got one only still two new old
  ever never nothing something someone`.split(/\s+/),
)
// Short forms people write for the same thing
const ALIASES: Record<string, string> = {dst: 'daylight', tz: 'timezone'}

function stem(word: string) {
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3)
  if (word.length > 4 && word.endsWith('ed')) return word.slice(0, -2)
  if (word.length > 4 && word.endsWith('es')) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

/** A bug's keywords: stem → the first word it came from (shown to people). */
export function keywordsOf(bug: Pick<DetectorBug, 'name' | 'symptoms'>) {
  const words = new Map<string, string>()
  for (const raw of `${bug.name ?? ''} ${bug.symptoms ?? ''}`.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    const word = ALIASES[raw] ?? raw
    if (word.length < 3 || STOP_WORDS.has(word) || /^\d+$/.test(word)) continue
    const key = stem(word)
    if (!words.has(key)) words.set(key, word)
  }
  return words
}

const sameText = (a: string | null, b: string | null) => Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase())

/** Scores one grave against a new bug, signal by signal. */
export function scoreMatch(bug: DetectorBug, grave: DetectorBug): Match {
  const mine = keywordsOf(bug)
  const theirs = keywordsOf(grave)
  const sharedKeywords = [...mine].filter(([key]) => theirs.has(key)).map(([, word]) => word)
  const sameCause = Boolean(bug.causeId && bug.causeId === grave.causeId)
  const sameLanguage = Boolean(bug.languageId && bug.languageId === grave.languageId)
  const sameComponent = sameText(bug.component, grave.component)
  const keywordPoints = Math.round((WEIGHTS.keywords * Math.min(sharedKeywords.length, FULL_KEYWORDS)) / FULL_KEYWORDS)

  const signals: MatchSignal[] = [
    {
      _key: 'cause',
      signal: 'cause',
      label: 'Same cause of death',
      matched: sameCause,
      detail: sameCause ? `${grave.cause}` : `${bug.cause ?? 'unknown'} vs ${grave.cause ?? 'unknown'}`,
      points: sameCause ? WEIGHTS.cause : 0,
    },
    {
      _key: 'language',
      signal: 'language',
      label: 'Same language',
      matched: sameLanguage,
      detail: sameLanguage ? `${grave.language}` : `${bug.language ?? 'unknown'} vs ${grave.language ?? 'unknown'}`,
      points: sameLanguage ? WEIGHTS.language : 0,
    },
    {
      _key: 'component',
      signal: 'component',
      label: 'Same component',
      matched: sameComponent,
      detail: sameComponent ? `${grave.component}` : `${bug.component || 'not given'} vs ${grave.component || 'not given'}`,
      points: sameComponent ? WEIGHTS.component : 0,
    },
    {
      _key: 'keywords',
      signal: 'keywords',
      label: 'Shared keywords',
      matched: sharedKeywords.length > 0,
      detail: sharedKeywords.length > 0 ? sharedKeywords.join(', ') : 'none',
      points: keywordPoints,
    },
  ]
  return {grave, score: signals.reduce((sum, s) => sum + s.points, 0), signals, sharedKeywords}
}

/**
 * The best-matching grave (a tie goes to the name that sorts first), and whether it
 * passes the threshold. `graves` should only hold graves that are allowed to rise.
 */
export function findResurrection(bug: DetectorBug, graves: DetectorBug[]) {
  const matches = graves
    .filter((grave) => grave._id !== bug._id)
    .map((grave) => scoreMatch(bug, grave))
    .sort((a, b) => b.score - a.score || (a.grave.name ?? '').localeCompare(b.grave.name ?? ''))
  const best = matches[0] ?? null
  return {best, passes: Boolean(best && best.score >= MATCH_THRESHOLD)}
}
