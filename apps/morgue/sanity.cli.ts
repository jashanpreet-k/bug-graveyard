import {realpathSync} from 'node:fs'

import {defineCliConfig} from 'sanity/cli'

// Run the CLI through `npm run dev|build|deploy` (see run-sanity.mjs), not directly.
//
// The lifecycle rules live in the site's `sanity/lib/lifecycle.ts`, so the Studio's
// actions and the Morgue share one copy of them. Vite only serves files from folders
// it's allowed to, so allow the whole repository (run-sanity.mjs passes its path)
// alongside the folder the CLI runs in.
const repoRoot = process.env.MORGUE_REPO_ROOT
const here = [process.cwd(), realpathSync(process.cwd())]

export default defineCliConfig({
  app: {
    organizationId: 'o0zfmcbiy',
    entry: './src/App.tsx',
    title: 'Morgue',
    icon: './icon.svg',
  },
  vite: (config) =>
    repoRoot
      ? {...config, server: {...config.server, fs: {...config.server?.fs, allow: [...(config.server?.fs?.allow ?? []), ...here, repoRoot]}}}
      : config,
})
