import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' makes the built assets load with relative paths, so the dist/
// folder works on any static host (Vercel, Netlify, GitHub Pages, a plain
// file server) without knowing the deploy URL in advance.
export default defineConfig({
  plugins: [react()],
  base: './',
})
