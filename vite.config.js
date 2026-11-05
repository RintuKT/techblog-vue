import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import content from './scripts/vite-content.mjs'

export default defineConfig({
  plugins: [vue(), content()],
  server: { port: 5180 },
  // Current browsers preload modules natively; skipping the polyfill keeps the entry script smaller.
  build: { modulePreload: { polyfill: false } },
})
