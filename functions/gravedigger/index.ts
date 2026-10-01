import {createClient} from '@sanity/client'
import {scheduledEventHandler} from '@sanity/functions'

import {burialCutoff, daysBetween, daysUntilBurial, todayUTC} from '../../sanity/lib/lifecycle'
import {exampleCutoff, EXPIRED_EXAMPLES_QUERY} from '../../sanity/lib/publicReport'

// The gravedigger: a scheduled Sanity Function that runs once a day (see
// sanity.blueprint.ts) and buries every bug whose fix has held for BURIAL_WAIT_DAYS,
// the same rule as the Studio's "Declare buried" action.
//
// Like that action, it changes the published bug in one revision-guarded mutation,
// and it leaves alone any bug with unpublished Studio changes, which would otherwise
// overwrite the new status when they're published.
//
// It also sweeps away the report page's example reports older than an hour. The
// report page does that too whenever someone sends a report; this daily run is the
// backstop for quiet days.
//
// Set DRY_RUN=1 to only log what it would bury and delete.

const PROJECT_ID = 'rzjmw6lg'
const DATASET = 'production'
const API_VERSION = '2026-09-28'

interface DueBug {
  _id: string
  _rev: string
  name: string | null
  fixMergedAt: string
}

// Published bugs whose fix is old enough, plus every bug with a draft or release version
const QUERY = `{
  "due": *[_type == "bug" && status == "fix-merged" && fixMergedAt <= $cutoff
    && !(_id in path("drafts.**")) && !(_id in path("versions.**"))
  ] | order(fixMergedAt asc) {_id, _rev, name, fixMergedAt},
  "unpublished": *[_type == "bug" && (_id in path("drafts.**") || _id in path("versions.**"))]._id
}`

// "drafts.abc" and "versions.<release>.abc" both belong to "abc"
const publishedId = (id: string) => id.replace(/^(drafts|versions\.[^.]+)\./, '')

export const handler = scheduledEventHandler(async ({context}) => {
  const client = createClient({
    projectId: context.clientOptions?.projectId ?? PROJECT_ID,
    dataset: DATASET,
    apiHost: context.clientOptions?.apiHost,
    token: context.clientOptions?.token,
    apiVersion: API_VERSION,
    useCdn: false,
  })
  const dryRun = process.env.DRY_RUN === '1'
  const today = todayUTC()

  // Example reports that have had their hour. A failure here never stops the burials.
  try {
    const cutoff = exampleCutoff()
    const expired = await client.fetch<string[]>(`${EXPIRED_EXAMPLES_QUERY}._id`, {cutoff}, {perspective: 'raw'})
    if (expired.length === 0) {
      console.log('👻 No example reports to sweep away.')
    } else if (dryRun) {
      console.log(`🔎 Would delete ${expired.length} example report(s) older than an hour`)
    } else {
      await client.delete({query: EXPIRED_EXAMPLES_QUERY, params: {cutoff}})
      console.log(`👻 Deleted ${expired.length} example report(s) older than an hour`)
    }
  } catch (err) {
    console.log(`⚠️  Couldn't sweep away example reports: ${err instanceof Error ? err.message : String(err)}`)
  }

  const {due, unpublished} = await client.fetch<{due: DueBug[]; unpublished: string[]}>(
    QUERY,
    {cutoff: burialCutoff(today)},
    {perspective: 'raw'},
  )
  const blocked = new Set(unpublished.map(publishedId))
  // The query narrows it down; the Studio's own rule has the last word
  const ready = due.filter((bug) => daysUntilBurial(bug.fixMergedAt, today) === 0)

  let buried = 0
  for (const bug of ready) {
    const label = `“${bug.name ?? bug._id}” (fix merged ${bug.fixMergedAt}, ${daysBetween(bug.fixMergedAt, today)} days ago)`
    if (blocked.has(bug._id)) {
      console.log(`⏸️  Left ${label}: it has unpublished changes in the Studio`)
      continue
    }
    if (dryRun) {
      console.log(`🔎 Would bury ${label}`)
      continue
    }
    try {
      await client.patch(bug._id).ifRevisionId(bug._rev).set({status: 'buried', buriedAt: today}).commit()
      buried++
      console.log(`🪦 Buried ${label}`)
    } catch (err) {
      // Most likely someone changed it since the query; tomorrow's run will look again
      console.log(`⚠️  Couldn't bury ${label}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log(
    ready.length === 0
      ? `⚰️  Nothing to bury on ${today}.`
      : `⚰️  ${dryRun ? 'Dry run' : 'Done'} on ${today}: ${buried} buried, ${ready.length - buried} left.`,
  )
})
