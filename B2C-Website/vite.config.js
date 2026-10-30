import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'
import { assetOutput, organizedPreview } from '../shared/scripts/site-layout.mjs'

import { integrationProxy } from '../shared/scripts/integration-proxy.mjs'

const here = (path) => fileURLToPath(new URL(path, import.meta.url))
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), organizedPreview()],
  resolve: {
    alias: {
      react: here('./node_modules/react'),
      'react-dom': here('./node_modules/react-dom'),
      'react-router': here('./node_modules/react-router'),
    },
    dedupe: ['react', 'react-dom', 'react-router'],
  },
  server: {
    host: '127.0.0.1',
    proxy: integrationProxy(mode, loadEnv(mode, process.cwd(), 'VITE_'), 'b2c'),
    fs: { allow: [here('.'), here('../shared')] },
  },
  build: { manifest: true, rolldownOptions: { output: assetOutput } },
}))
