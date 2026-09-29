'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `/app/studio/[[...tool]]/page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

import {AcceptCoronerReportAction} from './sanity/actions/coroner'
import {lifecycleActions} from './sanity/actions/lifecycle'
import {ApprovePublicReportAction} from './sanity/actions/publicReport'
// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './sanity/env'
import {schema} from './sanity/schemaTypes'
import {defaultDocumentNode, structure} from './sanity/structure'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  plugins: [
    structureTool({structure, defaultDocumentNode}),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
  document: {
    // Bugs get the lifecycle actions and the coroner's report right after Publish;
    // Sanity's own actions stay.
    actions: (prev, {schemaType}) => {
      if (schemaType !== 'bug') return prev
      const afterPublish = prev.findIndex((action) => action.action === 'publish') + 1
      return [
        ...prev.slice(0, afterPublish),
        AcceptCoronerReportAction,
        ApprovePublicReportAction,
        ...lifecycleActions,
        ...prev.slice(afterPublish),
      ]
    },
  },
})
