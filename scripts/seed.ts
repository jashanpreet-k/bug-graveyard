/**
 * Seeds the documents bugs point at: languages and causes of death.
 *
 *   npx sanity exec scripts/seed.ts --with-user-token
 *
 * Every document gets a fixed ID and is written with createIfNotExists, so the
 * script is safe to re-run and never overwrites edits made in the Studio.
 * IDs use hyphens, not dots: Sanity treats a dotted ID as a private path that a
 * public dataset won't serve without a token.
 */
import {getCliClient} from 'sanity/cli'

import {apiVersion} from '../sanity/env'

const client = getCliClient({apiVersion})

const languages = [
  {key: 'javascript', name: 'JavaScript', color: '#F7DF1E'},
  {key: 'python', name: 'Python', color: '#3776AB'},
  {key: 'typescript', name: 'TypeScript', color: '#3178C6'},
  {key: 'java', name: 'Java', color: '#ED8B00'},
  {key: 'cpp', name: 'C++', color: '#00599C'},
]

const causesOfDeath = [
  {
    key: 'off-by-one',
    title: 'Off-by-one',
    description: 'Looped once too often, or once too few. A `<=` where a `<` belonged.',
  },
  {
    key: 'null-reference',
    title: 'Null reference',
    description: 'Reached for something that was not there. "Cannot read properties of undefined".',
  },
  {
    key: 'race-condition',
    title: 'Race condition',
    description: 'Two things happened in the wrong order. Only sometimes, and never with a debugger attached.',
  },
  {
    key: 'timezone',
    title: 'Timezone',
    description: 'Worked perfectly, except at midnight UTC, during daylight saving, or for anyone else on Earth.',
  },
  {
    key: 'infinite-loop',
    title: 'Infinite loop',
    description: 'Never finished. Died of exhaustion and took the browser tab with it.',
  },
  {
    key: 'works-on-my-machine',
    title: 'Works on my machine',
    description: 'Passed every test locally, then met production and an environment it had never seen.',
  },
]

const docs: Array<{_id: string; _type: string} & Record<string, unknown>> = [
  ...languages.map(({key, ...fields}) => ({_id: `language-${key}`, _type: 'language', ...fields})),
  ...causesOfDeath.map(({key, ...fields}) => ({
    _id: `causeOfDeath-${key}`,
    _type: 'causeOfDeath',
    ...fields,
  })),
]

async function seed() {
  if (!client.config().token) {
    throw new Error('No auth token. Run with: npx sanity exec scripts/seed.ts --with-user-token')
  }

  const existing = new Set(
    await client.fetch<string[]>('*[_id in $ids]._id', {ids: docs.map((doc) => doc._id)}),
  )

  const tx = client.transaction()
  for (const doc of docs) tx.createIfNotExists(doc)
  await tx.commit()

  const {projectId, dataset} = client.config()
  console.log(`Seeded ${projectId}/${dataset}:`)
  for (const doc of docs) {
    console.log(`  ${existing.has(doc._id) ? 'skipped (exists)' : 'created         '}  ${doc._id}`)
  }
}

seed().catch((err) => {
  console.error(`Seeding failed: ${err.message}`)
  process.exit(1)
})
