import { resolve } from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      interval: 150,
      usePolling: true,
    },
  },
  base: './',
  build: {
    emptyOutDir: true,
    outDir: resolve(__dirname, 'web/dist'),
  },
})
