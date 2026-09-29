// EXPERIMENT: binds the lifecycle definitions to a deployment. Only validated
// offline (`sanity-workflows deploy --check`); nothing has been deployed.
import {defineWorkflowConfig} from '@sanity/workflow-engine/define'

import {bugLifecycle, zombieLifecycle} from './workflows/bug-lifecycle'

export default defineWorkflowConfig({
  deployments: [
    {
      name: 'experiment',
      tag: 'experiment',
      expectedMinReaderModel: 10,
      // A separate dataset would keep engine documents away from the site's content.
      workflowResource: {type: 'dataset', id: 'rzjmw6lg.workflows'},
      definitions: [bugLifecycle, zombieLifecycle],
    },
  ],
})
