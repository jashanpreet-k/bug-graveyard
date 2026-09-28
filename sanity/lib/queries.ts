import {defineQuery} from 'next-sanity'

// Every bug in the graveyard, newest death first. $language and $cause narrow
// the list; pass null to skip either filter. A grave is "disturbed" when another
// bug's previousLife points at it: the bug it held has risen as a zombie.
export const GRAVEYARD_QUERY = defineQuery(`
  *[_type == "bug"
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
    "disturbed": count(*[_type == "bug" && previousLife._ref == ^._id]) > 0
  }
`)

// The fields shown on a mini tombstone: a past life, or a zombie that rose.
const PAST_LIFE = `name, "slug": slug.current, epitaph, status, bornAt, fixMergedAt, buriedAt`

// One grave by slug, with its past lives (the previousLife chain, three levels
// deep; the deepest says whether it goes further back) and every zombie that
// rose from it.
export const GRAVE_QUERY = defineQuery(`
  *[_type == "bug" && slug.current == $slug][0] {
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
    language->{name, color},
    causeOfDeath->{title, description},
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

// Every grave's slug, for prerendering the grave pages at build time.
export const GRAVE_SLUGS_QUERY = defineQuery(`
  *[_type == "bug" && defined(slug.current)] {"slug": slug.current}
`)

// The filter options, with how many bugs each one holds.
export const GRAVEYARD_FILTERS_QUERY = defineQuery(`{
  "languages": *[_type == "language"] | order(name asc) {
    name,
    color,
    "count": count(*[_type == "bug" && language._ref == ^._id])
  },
  "causes": *[_type == "causeOfDeath"] | order(title asc) {
    title,
    "count": count(*[_type == "bug" && causeOfDeath._ref == ^._id])
  }
}`)
