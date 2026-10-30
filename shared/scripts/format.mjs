import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const formatter = resolve('node_modules/prettier/bin/prettier.cjs')
execFileSync(
  process.execPath,
  [
    formatter,
    process.argv.includes('--write') ? '--write' : '--check',
    '--config',
    resolve(root, '.prettierrc.json'),
    '--ignore-path',
    resolve(root, '.prettierignore'),
    'B2B-Website/src/**/*.{js,jsx,css,json}',
    'B2C-Website/src/**/*.{js,jsx,css,json}',
    'B2B-Website/*.{js,json,html}',
    'B2C-Website/*.{js,json,html}',
    'B2B-Website/.oxlintrc.json',
    'B2C-Website/.oxlintrc.json',
    'shared/**/*.{js,jsx,mjs,css,json}',
    '.prettierrc.json',
  ],
  { cwd: root, stdio: 'inherit' },
)
