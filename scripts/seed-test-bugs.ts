/**
 * Creates three published test bugs: two graves, and a zombie that rose from one.
 *
 *   npx sanity exec scripts/seed-test-bugs.ts --with-user-token
 *   npx sanity exec scripts/seed-test-bugs.ts --with-user-token -- --delete
 *
 * Needs the languages and causes of death from scripts/seed.ts. Every ID starts
 * with "test-bug-" and is written with createIfNotExists, so the script is safe to
 * re-run. --delete removes all test bugs, and any Studio drafts of them, in one
 * transaction: the zombie references its grave, so they must go together.
 */
import {getCliClient} from 'sanity/cli'

import {apiVersion} from '../sanity/env'

const client = getCliClient({apiVersion})

const ref = (_ref: string) => ({_type: 'reference', _ref})
const slug = (current: string) => ({_type: 'slug', current})

const docs: Array<{_id: string; _type: string} & Record<string, unknown>> = [
  {
    _id: 'test-bug-nullpointer-checkout',
    _type: 'bug',
    name: 'NullPointerException in checkout',
    slug: slug('nullpointerexception-in-checkout'),
    language: ref('language-typescript'),
    causeOfDeath: ref('causeOfDeath-null-reference'),
    severity: 'critical',
    status: 'buried',
    epitaph: 'It pointed to nothing, and so do we.',
    killedBy: 'Jashanpreet',
    hoursToKill: 6,
    bornAt: '2026-07-14',
    fixMergedAt: '2026-08-02',
    buriedAt: '2026-08-05',
    timesResurrected: 0,
  },
  {
    _id: 'test-bug-timezone-scheduler',
    _type: 'bug',
    name: 'Timezone bug in scheduler',
    slug: slug('timezone-bug-in-scheduler'),
    language: ref('language-python'),
    causeOfDeath: ref('causeOfDeath-timezone'),
    severity: 'medium',
    status: 'buried',
    epitaph: 'Died at 00:00 UTC. Still alive in IST.',
    killedBy: 'Jashanpreet',
    hoursToKill: 14,
    bornAt: '2026-03-29', // the night European clocks sprang forward
    fixMergedAt: '2026-04-10',
    buriedAt: '2026-04-12',
    timesResurrected: 0,
  },
  {
    // Still walking: no fix, burial or killer yet. Those get filled in once it is
    // fixed again and moves back through fix-merged → buried.
    _id: 'test-bug-timezone-scheduler-zombie-1',
    _type: 'bug',
    name: 'Timezone bug in scheduler (Zombie #1)',
    slug: slug('timezone-bug-in-scheduler-zombie-1'),
    language: ref('language-python'),
    causeOfDeath: ref('causeOfDeath-timezone'),
    severity: 'critical',
    status: 'zombie',
    epitaph: "You can't kill what lives in every timezone.",
    bornAt: '2026-09-14',
    previousLife: ref('test-bug-timezone-scheduler'),
    timesResurrected: 1,
  },
]

async function seed() {
  const existing = new Set(
    await client.fetch<string[]>('*[_id in $ids]._id', {ids: docs.map((doc) => doc._id)}),
  )

  // The grave comes before its zombie so the reference has something to point at.
  const tx = client.transaction()
  for (const doc of docs) tx.createIfNotExists(doc)
  await tx.commit()

  for (const doc of docs) {
    console.log(`  ${existing.has(doc._id) ? 'skipped (exists)' : 'created         '}  ${doc._id}`)
  }
}

async function remove() {
  // path() globs only match whole dot-separated segments, so a prefix needs startsWith.
  // Drafts are only visible in the raw perspective.
  const ids = await client.fetch<string[]>(
    '*[string::startsWith(_id, "test-bug-") || string::startsWith(_id, "drafts.test-bug-")]._id',
    {},
    {perspective: 'raw'},
  )
  if (ids.length === 0) {
    console.log('  nothing to delete')
    return
  }

  const tx = client.transaction()
  for (const id of ids) tx.delete(id)
  await tx.commit()

  for (const id of ids) console.log(`  deleted  ${id}`)
}

async function main() {
  if (!client.config().token) {
    throw new Error(
      'No auth token. Run with: npx sanity exec scripts/seed-test-bugs.ts --with-user-token',
    )
  }

  const {projectId, dataset} = client.config()
  if (process.argv.includes('--delete')) {
    console.log(`Deleting test bugs from ${projectId}/${dataset}:`)
    await remove()
  } else {
    console.log(`Seeding test bugs into ${projectId}/${dataset}:`)
    await seed()
  }
}

main().catch((err) => {
  console.error(`Failed: ${err.message}`)
  process.exit(1)
})
