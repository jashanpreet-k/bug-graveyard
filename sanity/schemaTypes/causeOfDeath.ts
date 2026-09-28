import {defineField, defineType} from 'sanity'

export const causeOfDeath = defineType({
  name: 'causeOfDeath',
  title: 'Cause of death',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The kind of bug, as written on the death certificate, e.g. "Off-by-one".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'A line or two on how bugs of this kind usually die.',
    }),
  ],
})
