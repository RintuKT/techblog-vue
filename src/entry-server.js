import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory } from 'vue-router'
import App from './App.vue'
import { createBlogRouter, loadBody } from './router.js'
import { headTags, pageMeta, SITE } from './lib/seo.js'
import { posts } from './lib/content.js'
import { releases } from './lib/releases.js'

// Used only by the build (scripts/prerender.mjs): renders one page to HTML with its <head> tags.
export async function render(path) {
  const router = createBlogRouter(createMemoryHistory())
  const app = createSSRApp(App).use(router)
  await router.push(path)
  await router.isReady()
  await loadBody(router.currentRoute.value)
  const meta = pageMeta(router.currentRoute.value)
  return { html: await renderToString(app), head: headTags(meta), meta }
}

export const pages = ['/', '/releases', '/authors', ...posts.map((p) => `/post/${p.slug}`), ...releases.map((r) => `/releases/${r.slug}`)]
export { SITE, posts, releases }
