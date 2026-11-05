import { createRouter } from 'vue-router'
import PostList from './views/PostList.vue'
import PostView from './views/PostView.vue'
import AuthorsView from './views/AuthorsView.vue'
import ReleasesView from './views/ReleasesView.vue'
import ReleaseView from './views/ReleaseView.vue'
import NotFound from './views/NotFound.vue'
import { findPost } from './lib/content.js'
import { findRelease } from './lib/releases.js'

// Real paths (/post/slug), so every page has its own address that search engines and AI agents can read.
// The browser uses web history, the build-time prerender uses memory history (see entry-server.js).
export function createBlogRouter(history) {
  return createRouter({
    history,
    routes: [
      { path: '/', component: PostList },
      { path: '/post/:slug', component: PostView, props: true },
      { path: '/authors', component: AuthorsView },
      { path: '/releases', component: ReleasesView },
      { path: '/releases/:slug', component: ReleaseView, props: true },
      { path: '/:pathMatch(.*)*', component: NotFound },
    ],
    // Back and forward return to where you were (a frame later, once a lazily loaded body is in);
    // a new page starts at the top, and filters on the same page keep the scroll. A reload starts with the phone
    // calendar folded, so what an open month added above the stories comes off (dsExtra, see DayStrip).
    scrollBehavior: (to, from, saved) => {
      if (!saved) return to.path === from.path ? undefined : { top: 0 }
      const extra = history.state?.dsExtra || 0
      return new Promise((done) => requestAnimationFrame(() => done({ left: saved.left, top: Math.max(0, saved.top - extra) })))
    },
  })
}

/** Loads the body of the post or release a route shows, so the page renders complete in one pass. */
export function loadBody(route) {
  const item = route.path.startsWith('/post/') ? findPost(route.params.slug) : route.path.startsWith('/releases/') ? findRelease(route.params.slug) : null
  return item ? item.loadHtml() : Promise.resolve('')
}
