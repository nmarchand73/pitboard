import { defineConfig } from 'vite'

/** GitHub Pages project site uses /<repo>/ ; local dev uses `/` (set in CI only). */
export default defineConfig({
  base: process.env.VITE_BASE_URL || '/',
})
