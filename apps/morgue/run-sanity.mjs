// Runs the Sanity CLI for this app: `node run-sanity.mjs dev|build|deploy …`.
//
// Why not just `sanity dev`? The CLI finds its project by looking for a Studio config
// (`sanity.config.ts`) in the current folder and every parent folder *before* it looks
// for an app config. This app lives inside the site's repo, whose root has the site's
// Studio config, so plain `sanity dev` here would run (and `sanity deploy` would
// deploy) the site's Studio instead. So the CLI runs from a mirror folder outside the
// repo, made of symlinks to the real files; its build output stays in the mirror.
import {spawnSync} from 'node:child_process'
import {mkdirSync, readdirSync, rmSync, symlinkSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const appDir = fileURLToPath(new URL('.', import.meta.url))
const mirror = join(tmpdir(), 'bug-graveyard-morgue')
const GENERATED = new Set(['dist', '.sanity', 'run-sanity.mjs'])

rmSync(mirror, {recursive: true, force: true})
mkdirSync(mirror, {recursive: true})
for (const entry of readdirSync(appDir)) {
  if (!GENERATED.has(entry)) symlinkSync(join(appDir, entry), join(mirror, entry))
}

const bin = join(appDir, 'node_modules', '.bin', 'sanity')
// sanity.cli.ts reads this to let Vite serve the repo's shared files
const env = {...process.env, MORGUE_REPO_ROOT: resolve(appDir, '../..')}
const {status} = spawnSync(bin, process.argv.slice(2), {cwd: mirror, stdio: 'inherit', env})
process.exit(status ?? 1)
