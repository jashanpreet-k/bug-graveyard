/**
 * Imports the bugs in content/graves.ts into Sanity as published documents.
 *
 *   npx sanity exec scripts/import-graves.ts --with-user-token -- --dry-run      check, change nothing
 *   npx sanity exec scripts/import-graves.ts --with-user-token                   import
 *   npx sanity exec scripts/import-graves.ts --with-user-token -- --delete-test  delete every "test-bug-" document
 *
 * Each entry becomes the document "grave-<key>", written with createOrReplace, so
 * re-running updates bugs in place: the file wins over edits made to them in the
 * Studio. Languages and causes of death are matched by name, `risesFrom` becomes
 * previousLife, and timesResurrected is counted along the chain. Nothing is
 * written if any entry has a problem.
 */
import {getCliClient} from 'sanity/cli'

import {graves} from '../content/graves'
import {apiVersion} from '../sanity/env'
import {GRAVE_ID_PREFIX, type Lookups, planGraves} from './lib/plan-graves'

const client = getCliClient({apiVersion})
const dryRun = process.argv.includes('--dry-run')

async function importGraves() {
  const lookups = await client.fetch<Lookups>(`{
    "languages": *[_type == "language"]{_id, name},
    "causes": *[_type == "causeOfDeath"]{_id, title},
    "slugs": *[_type == "bug" && defined(slug.current)]{_id, "slug": slug.current}
  }`)
  const {documents, problems} = planGraves(graves, lookups)

  if (problems.length > 0) {
    console.error('Nothing was imported. Fix these in content/graves.ts first:')
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  if (documents.length === 0) {
    console.log('content/graves.ts is empty, so there is nothing to import.')
    return
  }

  const ids = documents.map((doc) => doc._id)
  // Raw perspective: drafts only show up in raw.
  const [existing, drafts, notInFile] = await Promise.all([
    client.fetch<string[]>('*[_id in $ids]._id', {ids}),
    client.fetch<string[]>('*[_id in $drafts]._id', {drafts: ids.map((id) => `drafts.${id}`)}, {perspective: 'raw'}),
    client.fetch<string[]>('*[_type == "bug" && string::startsWith(_id, $prefix) && !(_id in $ids)]._id', {
      prefix: GRAVE_ID_PREFIX,
      ids,
    }),
  ])

  if (!dryRun) {
    const tx = client.transaction()
    for (const doc of documents) tx.createOrReplace(doc)
    await tx.commit()
  }

  const {projectId, dataset} = client.config()
  console.log(`${dryRun ? 'Dry run: would import' : 'Imported'} ${documents.length} graves into ${projectId}/${dataset}:`)
  for (const doc of documents) {
    const rises = doc.previousLife ? `, rises from ${(doc.previousLife as {_ref: string})._ref}` : ''
    console.log(`  ${existing.includes(doc._id) ? 'update' : 'create'}  ${doc._id}  (${doc.status}${rises}, resurrected ${doc.timesResurrected}×)`)
  }
  if (drafts.length > 0) {
    console.warn('\nThese have unpublished edits in the Studio. Publishing them would undo this import:')
    for (const id of drafts) console.warn(`  ${id}`)
  }
  if (notInFile.length > 0) {
    console.log('\nImported earlier but no longer in content/graves.ts (left untouched):')
    for (const id of notInFile) console.log(`  ${id}`)
  }
}

async function deleteTestBugs() {
  const ids = await client.fetch<string[]>(
    '*[string::startsWith(_id, "test-bug-") || string::startsWith(_id, "drafts.test-bug-")]._id',
    {},
    {perspective: 'raw'},
  )
  if (ids.length === 0) {
    console.log('There are no "test-bug-" documents to delete.')
    return
  }

  // Sanity refuses to delete a document that others still reference, e.g. a
  // zombie made in the Studio from a test bug. Name them instead of failing late.
  const blockers = await client.fetch<{_id: string; name?: string}[]>(
    '*[references($published) && !(_id in $ids)]{_id, name}',
    {published: ids.filter((id) => !id.startsWith('drafts.')), ids},
    {perspective: 'raw'},
  )
  if (blockers.length > 0) {
    console.error('Nothing was deleted. These documents still point at test bugs; delete them or change their links first:')
    for (const blocker of blockers) console.error(`  ${blocker._id}${blocker.name ? `  (${blocker.name})` : ''}`)
    process.exit(1)
  }

  if (!dryRun) {
    const tx = client.transaction()
    for (const id of ids) tx.delete(id)
    await tx.commit()
  }
  console.log(`${dryRun ? 'Dry run: would delete' : 'Deleted'} ${ids.length} test documents:`)
  for (const id of ids) console.log(`  ${id}`)
}

async function main() {
  if (!client.config().token) {
    throw new Error('No auth token. Run with: npx sanity exec scripts/import-graves.ts --with-user-token')
  }
  await (process.argv.includes('--delete-test') ? deleteTestBugs() : importGraves())
}

main().catch((err) => {
  console.error(`Failed: ${err.message}`)
  process.exit(1)
})
