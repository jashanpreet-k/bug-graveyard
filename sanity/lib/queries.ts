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
