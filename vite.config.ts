import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// User page (dinowithcurls.github.io) → served from the domain root.
// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
})
