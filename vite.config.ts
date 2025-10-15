import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/bid2build/', // ensure assets resolve under /bid2build/ on GitHub Pages
  plugins: [react()],
})
