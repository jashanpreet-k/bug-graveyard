import type {GraveEntry} from './types'

// Your graveyard. Each entry becomes a published bug in Sanity:
//
//   npx sanity exec scripts/import-graves.ts --with-user-token -- --dry-run   check first
//   npx sanity exec scripts/import-graves.ts --with-user-token                import
//
// Re-running updates the same bugs in place. Every field is explained in ./types.ts.
//
// The two entries below only show the format: a buried bug, and the zombie that
// rose from it when the fix regressed. Replace them with your own bugs.

export const graves: GraveEntry[] = [
  {
    key: 'example-stale-cache',
    name: 'Example: Stale cache after deploy',
    language: 'TypeScript',
    cause: 'Works on my machine',
    status: 'buried',
    severity: 'medium',
    epitaph: 'It remembered everything, except that things change.',
    killedBy: 'Jashanpreet',
    hoursToKill: 5,
    bornAt: '2026-02-02',
    fixMergedAt: '2026-02-06',
    buriedAt: '2026-02-14',
  },
  {
    key: 'example-stale-cache-returns',
    name: 'Example: Stale cache after deploy (Zombie #1)',
    risesFrom: 'example-stale-cache',
    language: 'TypeScript',
    cause: 'Works on my machine',
    status: 'zombie',
    severity: 'critical',
    epitaph: 'Cleared once. Came back cached.',
    bornAt: '2026-03-20',
  },
]
