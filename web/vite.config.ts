import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const src = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Keep in sync with "paths" in tsconfig.json.
    alias: [
      {
        find: /^(assets|components|features|pages|services|styles|types|utils)\//,
        replacement: `${src}/$1/`,
      },
    ],
  },
  server: { host: '0.0.0.0', port: 5173 },
  test: { environment: 'jsdom' },
})
