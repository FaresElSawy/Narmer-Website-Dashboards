import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
execFileSync(
  process.execPath,
  [
    resolve('node_modules/oxlint/bin/oxlint'),
    '--config',
    resolve('.oxlintrc.json'),
    resolve('src'),
    resolve('../shared'),
  ],
  { stdio: 'inherit' },
)
