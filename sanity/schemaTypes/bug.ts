import {defineArrayMember, defineField, defineType, getPublishedId} from 'sanity'

import {MatchSignalsInput} from '../components/MatchSignalsInput'
import {CORONER_STATUSES} from '../lib/coroner'
import {MATCH_STATUSES, MATCH_THRESHOLD} from '../lib/detector'
import {EPITAPH_MAX_LENGTH} from '../lib/epitaph'
import {REPORT_STATUSES} from '../lib/publicReport'
import {BUG_STATUSES} from '../lib/statuses'

export {EPITAPH_MAX_LENGTH}

export const bug = defineType({
  name: 'bug',
  title: 'Bug',
  type: 'document',
  icon: () => '🐛',
  groups: [
    {name: 'bug', title: 'The Bug'},
    {name: 'death', title: 'The Death'},
    {name: 'afterlife', title: 'Afterlife'},
    {name: 'coroner', title: 'Coroner’s report'},
    {name: 'report', title: 'Public report'},
  ],
  fields: [
    // The Bug
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'bug',
      description: 'What the bug will be remembered as, e.g. "The Midnight Timezone Shift".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'bug',
      description: 'The grave’s address on the site (/grave/<slug>). Click "Generate" to make it from the name.',
      options: {source: 'name', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'reference',
      to: [{type: 'language'}],
      group: 'bug',
      description: 'The language the bug lived in.',
    }),
    defineField({
      name: 'severity',
      title: 'Severity',
      type: 'string',
      group: 'bug',
      description: 'How much damage it did while it was alive.',
      options: {
        list: [
          {title: 'Low', value: 'low'},
          {title: 'Medium', value: 'medium'},
          {title: 'Critical', value: 'critical'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'component',
      title: 'Component',
      type: 'string',
      group: 'bug',
      description: 'Where it lived, in a word or two: "scheduler", "checkout", "auth". The Zombie Detector compares it.',
    }),
    defineField({
      name: 'symptoms',
      title: 'Symptoms',
      type: 'text',
      rows: 3,
      group: 'bug',
      description: 'What people saw while it was alive. The Zombie Detector compares its words with new bugs.',
    }),
    defineField({
      name: 'bornAt',
      title: 'Born',
      type: 'date',
      group: 'bug',
      description: 'When the bug was introduced. A best guess is fine.',
    }),

    // The Death
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: ['death', 'afterlife'],
      description: 'Where the bug is in its journey: suspected dead → fix merged → buried, or back as a zombie.',
      options: {
        list: BUG_STATUSES.map(({value, title, emoji}) => ({title: `${emoji} ${title}`, value})),
        layout: 'radio',
      },
      initialValue: 'suspected-dead',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'causeOfDeath',
      title: 'Cause of death',
      type: 'reference',
      to: [{type: 'causeOfDeath'}],
      group: 'death',
      description: 'What kind of bug it was.',
    }),
    defineField({
      name: 'killedBy',
      title: 'Killed by',
      type: 'string',
      group: 'death',
      description: 'Who fixed it: a name or @github handle.',
    }),
    defineField({
      name: 'hoursToKill',
      title: 'Hours to kill',
      type: 'number',
      group: 'death',
      description: 'Roughly how many hours it took to find and fix.',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'fixSummary',
      title: 'The fix',
      type: 'string',
      group: 'death',
      description: 'How it was fixed, in one line.',
    }),
    defineField({
      name: 'fixUrl',
      title: 'Fix link',
      type: 'url',
      group: 'death',
      description: 'The pull request or commit that fixed it.',
    }),
    defineField({
      name: 'fixMergedAt',
      title: 'Fix merged',
      type: 'date',
      group: 'death',
      readOnly: true,
      description: 'Filled in automatically when the status becomes "Fix merged".',
    }),
    defineField({
      name: 'buriedAt',
      title: 'Buried',
      type: 'date',
      group: 'death',
      readOnly: true,
      description: 'Filled in automatically when the status becomes "Buried".',
    }),
    defineField({
      name: 'epitaph',
      title: 'Epitaph',
      type: 'text',
      rows: 2,
      group: 'death',
      description: `The words carved on the tombstone. ${EPITAPH_MAX_LENGTH} characters at most.`,
      validation: (rule) => rule.max(EPITAPH_MAX_LENGTH),
    }),

    // Afterlife
    defineField({
      name: 'previousLife',
      title: 'Previous life',
      type: 'reference',
      to: [{type: 'bug'}],
      group: 'afterlife',
      description: 'The grave this zombie climbed out of: the earlier bug it is a regression of.',
      hidden: ({document}) => document?.status !== 'zombie',
      options: {
        // A bug can't be its own previous life, whether published or draft.
        filter: ({document}) => {
          const id = getPublishedId(document._id)
          return {filter: '!(_id in [$id, $draftId])', params: {id, draftId: `drafts.${id}`}}
        },
      },
    }),
    defineField({
      name: 'timesResurrected',
      title: 'Times resurrected',
      type: 'number',
      group: 'afterlife',
      readOnly: true,
      initialValue: 0,
      description: 'How many times this bug has come back from the dead. Updated automatically.',
      validation: (rule) => rule.min(0).integer(),
    }),

    // Coroner's report: written by the `coroner` Sanity Function, copied into the real
    // fields only by the "Accept coroner's report" action. Hidden until there is one.
    defineField({
      name: 'coronerStatus',
      title: 'Report status',
      type: 'string',
      group: 'coroner',
      readOnly: true,
      hidden: ({document}) => !document?.coronerStatus,
      options: {list: CORONER_STATUSES.map(({title, value}) => ({title, value}))},
    }),
    defineField({
      name: 'coronerEpitaph',
      title: 'Suggested epitaph',
      type: 'text',
      rows: 2,
      group: 'coroner',
      readOnly: true,
      hidden: ({document}) => !document?.coronerStatus,
      description: 'Drafted by AI. It only becomes the epitaph if someone accepts the report.',
      validation: (rule) => rule.max(EPITAPH_MAX_LENGTH),
    }),
    defineField({
      name: 'coronerCause',
      title: 'Suggested cause of death',
      type: 'reference',
      to: [{type: 'causeOfDeath'}],
      group: 'coroner',
      readOnly: true,
      hidden: ({document}) => !document?.coronerStatus,
    }),

    // The Zombie Detector's result: set by the coroner function for a new bug. It
    // never links anything itself; "Confirm resurrection" or "Dismiss" decides.
    defineField({
      name: 'matchStatus',
      title: 'Zombie Detector',
      type: 'string',
      group: 'coroner',
      readOnly: true,
      hidden: ({document}) => !document?.matchStatus,
      options: {list: MATCH_STATUSES.map(({title, value}) => ({title, value}))},
    }),
    defineField({
      name: 'resurrectionCandidate',
      title: 'Possibly a resurrection of',
      type: 'reference',
      to: [{type: 'bug'}],
      group: 'coroner',
      readOnly: true,
      hidden: ({document}) => !document?.resurrectionCandidate,
    }),
    defineField({
      name: 'matchScore',
      title: 'Match score',
      type: 'number',
      group: 'coroner',
      readOnly: true,
      hidden: ({document}) => document?.matchScore === undefined,
      description: `A match score from 4 signals, 0 to 100. A possible resurrection needs ${MATCH_THRESHOLD}.`,
    }),
    defineField({
      name: 'matchSignals',
      title: 'Signals',
      type: 'array',
      group: 'coroner',
      readOnly: true,
      hidden: ({document}) => !(document?.matchSignals as unknown[] | undefined)?.length,
      components: {input: MatchSignalsInput},
      of: [
        defineArrayMember({
          type: 'object',
          name: 'matchSignal',
          fields: [
            defineField({name: 'signal', type: 'string'}),
            defineField({name: 'label', type: 'string'}),
            defineField({name: 'matched', type: 'boolean'}),
            defineField({name: 'detail', type: 'string'}),
            defineField({name: 'points', type: 'number'}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'matchReason',
      title: 'Why it might be the same bug',
      type: 'text',
      rows: 2,
      group: 'coroner',
      readOnly: true,
      hidden: ({document}) => !document?.matchReason,
      description: 'One sentence written by an Agent Action from the signals above.',
    }),

    // Public report: set when someone reports the bug on the site's report page. A
    // pending report stays out of the graveyard until someone approves it here.
    defineField({
      name: 'publicReport',
      title: 'Public report',
      type: 'object',
      group: 'report',
      readOnly: true,
      hidden: ({document}) => !document?.publicReport,
      description: 'Sent from the site’s “Report a dead bug” page. Approve it with “Accept coroner’s report”.',
      fields: [
        defineField({
          name: 'status',
          title: 'Status',
          type: 'string',
          options: {list: REPORT_STATUSES.map(({title, value}) => ({title, value}))},
        }),
        defineField({name: 'whatHappened', title: 'What happened', type: 'text', rows: 3}),
        defineField({name: 'submittedAt', title: 'Submitted', type: 'datetime'}),
      ],
    }),
  ],
  preview: {
    select: {name: 'name', status: 'status', language: 'language.name'},
    prepare({name, status, language}) {
      const match = BUG_STATUSES.find((s) => s.value === status)
      return {
        title: name,
        subtitle: [match?.title ?? status, language].filter(Boolean).join(' · '),
        media: () => match?.emoji ?? '🐛',
      }
    },
  },
})
