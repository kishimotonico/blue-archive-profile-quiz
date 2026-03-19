/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/blue-archive-prof-quiz/',
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
