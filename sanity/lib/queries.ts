import {defineQuery} from 'next-sanity'

// A bug from the site's report page stays out of the graveyard (the homepage, grave
// pages, the leaderboard, filters and share images) until someone approves it in
// the Studio. Every query that lists graves includes this condition.
const IN_GRAVEYARD = `!(defined(publicReport) && publicReport.status == "pending")`

// A grave is haunted while the Zombie Detector suggests that a new bug might be it
// coming back and nobody has confirmed or dismissed that yet. Worked out here from
// the pending suggestions, never stored on the grave.
const HAUNTED = `count(*[_type == "bug" && matchStatus == "candidate" && resurrectionCandidate._ref == ^._id]) > 0`

// Every bug in the graveyard, newest death first. $language and $cause narrow
// the list; pass null to skip either filter. A grave is "disturbed" when another
// bug's previousLife points at it: the bug it held has risen as a zombie.
export const GRAVEYARD_QUERY = defineQuery(`
  *[_type == "bug" && ${IN_GRAVEYARD}
    && (!defined($language) || language->name == $language)
    && (!defined($cause) || causeOfDeath->title == $cause)
  ] | order(coalesce(buriedAt, fixMergedAt, bornAt) desc, name asc) {
    _id,
    name,
    "slug": slug.current,
    status,
    epitaph,
    bornAt,
    fixMergedAt,
    buriedAt,
    language->{name, color},
    causeOfDeath->{title},
    "previousLife": previousLife->{name},
    "disturbed": count(*[_type == "bug" && previousLife._ref == ^._id]) > 0,
    "haunted": ${HAUNTED}
  }
`)

// The fields shown on a mini tombstone: a past life, or a zombie that rose.
const PAST_LIFE = `name, "slug": slug.current, epitaph, status, bornAt, fixMergedAt, buriedAt`

// One grave by slug, with its past lives (the previousLife chain, three levels
// deep; the deepest says whether it goes further back) and every zombie that
// rose from it.
export const GRAVE_QUERY = defineQuery(`
  *[_type == "bug" && slug.current == $slug && ${IN_GRAVEYARD}][0] {
    _id,
    name,
    "slug": slug.current,
    status,
    severity,
    epitaph,
    killedBy,
    hoursToKill,
    bornAt,
    fixMergedAt,
    buriedAt,
    timesResurrected,
    component,
    symptoms,
    fixSummary,
    fixUrl,
    language->{name, color},
    causeOfDeath->{title, description},
    "haunting": *[_type == "bug" && matchStatus == "candidate" && resurrectionCandidate._ref == ^._id]
      | order(_createdAt desc)[0]{name, matchScore, "reportedAt": coalesce(publicReport.submittedAt, _createdAt)},
    "previousLife": previousLife->{
      ${PAST_LIFE},
      "previousLife": previousLife->{
        ${PAST_LIFE},
        "previousLife": previousLife->{
          ${PAST_LIFE},
          "hasOlderLives": defined(previousLife)
        }
      }
    },
    "risen": *[_type == "bug" && previousLife._ref == ^._id] | order(bornAt asc) {
      ${PAST_LIFE},
      "disturbed": count(*[_type == "bug" && previousLife._ref == ^._id]) > 0
    }
  }
`)

// The "Most Haunted" leaderboard, all from GROQ aggregations:
// - deadliest: top 5 by hours it took to kill them
// - hauntedLanguages: zombies per language (every bug with a previous life)
// - causes: bugs per cause of death
// - mostResurrected: the life with the highest timesResurrected, three lives back
export const LEADERBOARD_QUERY = defineQuery(`{
  "deadliest": *[_type == "bug" && defined(hoursToKill) && ${IN_GRAVEYARD}] | order(hoursToKill desc, name asc) [0...5] {
    name,
    "slug": slug.current,
    hoursToKill,
    language->{name, color}
  },
  "hauntedLanguages": *[_type == "language"] {
    name,
    color,
    "zombies": count(*[_type == "bug" && defined(previousLife) && language._ref == ^._id && ${IN_GRAVEYARD}])
  } [zombies > 0] | order(zombies desc, name asc),
  "causes": *[_type == "causeOfDeath"] {
    title,
    "bugs": count(*[_type == "bug" && causeOfDeath._ref == ^._id && ${IN_GRAVEYARD}])
  } [bugs > 0] | order(bugs desc, title asc),
  "mostResurrected": *[_type == "bug" && timesResurrected > 0 && ${IN_GRAVEYARD}] | order(timesResurrected desc, bornAt desc) [0] {
    ${PAST_LIFE},
    timesResurrected,
    "previousLife": previousLife->{
      ${PAST_LIFE},
      "previousLife": previousLife->{
        ${PAST_LIFE},
        "previousLife": previousLife->{
          ${PAST_LIFE},
          "hasOlderLives": defined(previousLife)
        }
      }
    }
  }
}`)

// What a grave's share image shows.
export const GRAVE_OG_QUERY = defineQuery(`
  *[_type == "bug" && slug.current == $slug && ${IN_GRAVEYARD}][0] {
    name,
    epitaph,
    status,
    bornAt,
    fixMergedAt,
    buriedAt,
    "language": language->name,
    "causeOfDeath": causeOfDeath->title,
    "risenFrom": previousLife->name,
    "disturbed": count(*[_type == "bug" && previousLife._ref == ^._id]) > 0
  }
`)

// Every grave's slug, for prerendering the grave pages at build time.
export const GRAVE_SLUGS_QUERY = defineQuery(`
  *[_type == "bug" && defined(slug.current) && ${IN_GRAVEYARD}] {"slug": slug.current}
`)

// The filter options, with how many bugs each one holds.
export const GRAVEYARD_FILTERS_QUERY = defineQuery(`{
  "languages": *[_type == "language"] | order(name asc) {
    name,
    color,
    "count": count(*[_type == "bug" && language._ref == ^._id && ${IN_GRAVEYARD}])
  },
  "causes": *[_type == "causeOfDeath"] | order(title asc) {
    title,
    "count": count(*[_type == "bug" && causeOfDeath._ref == ^._id && ${IN_GRAVEYARD}])
  }
}`)

// The report page: the languages to choose from, and the newest reports still
// waiting for approval, with the coroner's draft if it has written one.
export const REPORT_PAGE_QUERY = defineQuery(`{
  "languages": *[_type == "language"] | order(name asc) {_id, name},
  "pending": *[_type == "bug" && publicReport.status == "pending"] | order(publicReport.submittedAt desc) [0...20] {
    _id,
    name,
    "language": language->name,
    "whatHappened": publicReport.whatHappened,
    "submittedAt": publicReport.submittedAt,
    coronerStatus,
    coronerEpitaph,
    "coronerCause": coronerCause->title,
    matchStatus,
    matchScore,
    matchReason,
    matchSignals[]{_key, label, matched, detail, points},
    "candidate": resurrectionCandidate->{name, "slug": slug.current, fixSummary, fixUrl}
  },
  "components": array::unique(*[_type == "bug" && defined(component) && ${IN_GRAVEYARD}].component)
}`)
