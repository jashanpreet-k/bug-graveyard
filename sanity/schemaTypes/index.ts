import { type SchemaTypeDefinition } from 'sanity'

import { bug } from './bug'
import { causeOfDeath } from './causeOfDeath'
import { language } from './language'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [bug, language, causeOfDeath],
}
