// EXPERIMENT (explore/workflows branch, not deployed): a bug's life modelled as a
// Sanity Workflow, the same process as the Studio's lifecycle document actions.
import {
  defineAction,
  defineActivity,
  defineField,
  defineStage,
  defineTransition,
  defineWorkflow,
} from '@sanity/workflow-engine/define'

import {BURIAL_WAIT_DAYS} from '../sanity/lib/lifecycle'

const WAIT_SECONDS = BURIAL_WAIT_DAYS * 24 * 60 * 60

const stamp = (field: string) => ({type: 'field.set' as const, target: {field}, value: {type: 'now' as const}})

// Each way out of a stage stamps its own date, so a transition can tell which one fired.
const fix = defineActivity({
  name: 'fix',
  title: 'Get the fix merged',
  actions: [defineAction({name: 'mark-fix-merged', title: '🩹 Mark fix merged', status: 'done', ops: [stamp('fixMergedAt')]})],
})

const regression = defineActivity({
  name: 'regression',
  title: 'Watch for a regression',
  actions: [
    defineAction({name: 'report-resurrection', title: '🧟 Report resurrection', status: 'done', ops: [stamp('risenAt')]}),
  ],
})

const burial = defineActivity({
  name: 'burial',
  title: 'Bury it once the fix has held',
  // The Studio's 7-day rule, checked against $now whenever someone asks: no timer needed.
  requirements: [
    {
      type: 'groq',
      name: 'fix-held',
      title: `The fix must hold for ${BURIAL_WAIT_DAYS} days`,
      query: `dateTime($now) >= dateTime($fields.fixMergedAt) + ${WAIT_SECONDS}`,
    },
  ],
  actions: [defineAction({name: 'declare-buried', title: '🪦 Declare buried', status: 'done', ops: [stamp('buriedAt')]})],
})

const toRisen = defineTransition({name: 'to-risen', title: 'Rose again', to: 'risen', when: 'defined($fields.risenAt)'})

function lifecycle({name, title, firstStage}: {name: string; title: string; firstStage: {name: string; title: string}}) {
  return defineWorkflow({
    name,
    title,
    initialStage: firstStage.name,
    fields: [
      defineField({type: 'subject', name: 'subject', title: 'Bug', required: true, initialValue: {type: 'input'}}),
      defineField({type: 'datetime', name: 'fixMergedAt', title: 'Fix merged'}),
      defineField({type: 'datetime', name: 'buriedAt', title: 'Buried'}),
      defineField({type: 'datetime', name: 'risenAt', title: 'Rose again'}),
    ],
    start: {requirements: [{type: 'singleSubject', name: 'one-life-at-a-time', title: 'This bug already has a lifecycle running'}]},
    stages: [
      defineStage({
        ...firstStage,
        activities: [fix],
        transitions: [defineTransition({name: 'to-fix-merged', title: 'Fix merged', to: 'fix-merged'})],
      }),
      defineStage({
        name: 'fix-merged',
        title: 'Fix merged',
        activities: [burial, regression],
        transitions: [
          defineTransition({name: 'to-buried', title: 'Buried', to: 'buried', when: 'defined($fields.buriedAt)'}),
          toRisen,
        ],
      }),
      defineStage({name: 'buried', title: 'Buried', activities: [regression], transitions: [toRisen]}),
      defineStage({
        name: 'risen',
        title: 'Risen',
        description: 'The grave is empty: the bug came back, and its zombie runs its own lifecycle.',
      }),
    ],
  })
}

export const bugLifecycle = lifecycle({
  name: 'bug-lifecycle',
  title: 'Bug lifecycle',
  firstStage: {name: 'suspected-dead', title: 'Suspected dead'},
})

export const zombieLifecycle = lifecycle({
  name: 'zombie-lifecycle',
  title: 'Zombie lifecycle',
  firstStage: {name: 'walking', title: 'Walking'},
})
