import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: [
      'localhost',
      '30359bc7-d2e5-4a73-8ef3-cce9417c451d-00-1ajn31fjiex98.janeway.replit.dev',
      '.replit.dev'
    ],
    hmr: {
      port: 5000
    }
  }
})
