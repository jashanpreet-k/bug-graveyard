/**
* This configuration file lets you run `$ sanity [command]` in this folder
* Go to https://www.sanity.io/docs/cli to learn more.
**/
import { defineCliConfig } from 'sanity/cli'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

export default defineCliConfig({
  api: { projectId, dataset },
  // `npm run typegen` turns the schema and every defineQuery() into TypeScript types.
  schemaExtraction: { path: './sanity/extract.json', enforceRequiredFields: true },
  typegen: {
    path: './{app,components,sanity}/**/*.{ts,tsx}',
    schema: './sanity/extract.json',
    generates: './sanity/types.ts',
  },
})
