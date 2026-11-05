import { createApp } from 'vue'
import { createWebHistory } from 'vue-router'
import App from './App.vue'
import { createBlogRouter, loadBody } from './router.js'
import { applyHead, pageMeta } from './lib/seo.js'
import './style.css'

// Links shared before the switch to real paths look like /#/post/slug: send them to /post/slug.
if (location.hash.startsWith('#/')) history.replaceState(null, '', location.hash.slice(1))

const router = createBlogRouter(createWebHistory())
router.afterEach((to) => applyHead(pageMeta(to)))

// iOS only shows :active (the press squeeze) on pages that listen for touches.
addEventListener('touchstart', () => {}, { passive: true })

// Every page arrives already rendered (scripts/prerender.mjs). The app takes over once the body the page shows
// is loaded, so it replaces the page with the same content in one step.
const app = createApp(App).use(router)
router.isReady().then(() => loadBody(router.currentRoute.value)).finally(() => app.mount('#app'))
