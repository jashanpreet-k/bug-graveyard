// A bug's lifecycle. Shared by the schema and the site, so it must not import
// from 'sanity' (that would pull the whole Studio package into the site).
export const BUG_STATUSES = [
  {value: 'suspected-dead', title: 'Suspected dead', emoji: '💀'},
  {value: 'fix-merged', title: 'Fix merged', emoji: '🩹'},
  {value: 'buried', title: 'Buried', emoji: '🪦'},
  {value: 'zombie', title: 'Zombie', emoji: '🧟'},
] as const

export type BugStatus = (typeof BUG_STATUSES)[number]['value']
