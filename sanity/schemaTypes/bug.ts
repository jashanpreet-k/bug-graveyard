import {defineField, defineType, getPublishedId} from 'sanity'

import {BUG_STATUSES} from '../lib/statuses'

/** Longest epitaph that fits on a tombstone. */
export const EPITAPH_MAX_LENGTH = 140

export const bug = defineType({
  name: 'bug',
  title: 'Bug',
  type: 'document',
  icon: () => '🐛',
  groups: [
    {name: 'bug', title: 'The Bug'},
    {name: 'death', title: 'The Death'},
    {name: 'afterlife', title: 'Afterlife'},
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
