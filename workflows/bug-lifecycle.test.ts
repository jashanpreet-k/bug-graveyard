// Runs the real Workflows engine in memory (no project, no network).
import {ActionDisabledError, StartNotAllowedError} from '@sanity/workflow-engine'
import {createBench, subjectField} from '@sanity/workflow-engine-test'
import {expect, test} from 'vitest'

import {bugLifecycle, zombieLifecycle} from './bug-lifecycle'

const T0 = '2026-09-01T09:00:00.000Z'
const DAY_MS = 24 * 60 * 60 * 1000
const bugs = [
  {_id: 'grave-stale-cache', _type: 'bug', name: 'Stale cache after deploy', status: 'suspected-dead'},
  {_id: 'grave-stale-cache-z1', _type: 'bug', name: 'Stale cache after deploy (Zombie #1)', status: 'zombie'},
]

async function start(definition: 'bug-lifecycle' | 'zombie-lifecycle', id: string) {
  const bench = createBench({now: T0, documents: bugs})
  await bench.deployDefinitions({expectedMinReaderModel: 10, definitions: [bugLifecycle, zombieLifecycle]})
  const {instance} = await bench.startInstance({definition, initialFields: [subjectField(id, {type: 'bug'})]})
  return {bench, id: instance._id, stage: instance.currentStage}
}

const verdict = async (bench: Awaited<ReturnType<typeof start>>['bench'], instanceId: string, name: string) =>
  (await bench.evaluate({instanceId})).currentStage.activities
    .flatMap((activity) => activity.actions)
    .find((candidate) => candidate.action.name === name)

test('suspected dead → fix merged → (7 days) → buried → risen', async () => {
  const {bench, id, stage} = await start('bug-lifecycle', 'grave-stale-cache')
  expect(stage).toBe('suspected-dead')

  await bench.fireAction({instanceId: id, activity: 'fix', action: 'mark-fix-merged'})
  expect(await bench.currentStage(id)).toBe('fix-merged')

  // Burial waits for the fix to hold; a resurrection could be reported any time.
  expect(await verdict(bench, id, 'declare-buried')).toMatchObject({allowed: false})
  expect(await verdict(bench, id, 'report-resurrection')).toMatchObject({allowed: true})
  await expect(bench.fireAction({instanceId: id, activity: 'burial', action: 'declare-buried'})).rejects.toBeInstanceOf(
    ActionDisabledError,
  )

  bench.advance(6 * DAY_MS)
  expect(await verdict(bench, id, 'declare-buried')).toMatchObject({allowed: false})
  bench.advance(1 * DAY_MS)
  expect(await verdict(bench, id, 'declare-buried')).toMatchObject({allowed: true})

  await bench.fireAction({instanceId: id, activity: 'burial', action: 'declare-buried'})
  expect(await bench.currentStage(id)).toBe('buried')

  await bench.fireAction({instanceId: id, activity: 'regression', action: 'report-resurrection'})
  expect(await bench.currentStage(id)).toBe('risen')
})

test('a fix that regresses before burial goes straight to risen', async () => {
  const {bench, id} = await start('bug-lifecycle', 'grave-stale-cache')
  await bench.fireAction({instanceId: id, activity: 'fix', action: 'mark-fix-merged'})
  await bench.fireAction({instanceId: id, activity: 'regression', action: 'report-resurrection'})
  expect(await bench.currentStage(id)).toBe('risen')
})

test('a zombie starts walking and goes through the same lifecycle', async () => {
  const {bench, id, stage} = await start('zombie-lifecycle', 'grave-stale-cache-z1')
  expect(stage).toBe('walking')
  await bench.fireAction({instanceId: id, activity: 'fix', action: 'mark-fix-merged'})
  expect(await bench.currentStage(id)).toBe('fix-merged')
})

test('one lifecycle per bug at a time', async () => {
  const {bench} = await start('bug-lifecycle', 'grave-stale-cache')
  await expect(
    bench.startInstance({definition: 'bug-lifecycle', initialFields: [subjectField('grave-stale-cache', {type: 'bug'})]}),
  ).rejects.toBeInstanceOf(StartNotAllowedError)
})
