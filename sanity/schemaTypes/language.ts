import {defineField, defineType} from 'sanity'

export const language = defineType({
  name: 'language',
  title: 'Language',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'The language as it appears on tombstones, e.g. "TypeScript".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'color',
      title: 'Colour',
      type: 'string',
      description: 'Brand colour as a hex code, e.g. #3178C6. Used to tint this language’s graves.',
      validation: (rule) =>
        rule.regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i, {name: 'hex colour'}).error(
          'Use a hex colour like #3178C6',
        ),
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'color'},
  },
})
