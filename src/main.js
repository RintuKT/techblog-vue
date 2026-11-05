import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import PostList from './views/PostList.vue'
import PostView from './views/PostView.vue'
import AuthorsView from './views/AuthorsView.vue'
import ReleasesView from './views/ReleasesView.vue'
import ReleaseView from './views/ReleaseView.vue'
import './style.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: PostList },
    { path: '/post/:slug', component: PostView, props: true },
    { path: '/authors', component: AuthorsView },
    { path: '/releases', component: ReleasesView },
    { path: '/releases/:slug', component: ReleaseView, props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  // Back and forward return to where you were (a frame later, once a lazily loaded body is in);
  // a new page starts at the top, and filters on the same page keep the scroll.
  scrollBehavior: (to, from, saved) =>
    saved ? new Promise((done) => requestAnimationFrame(() => done(saved))) : to.path === from.path ? undefined : { top: 0 },
})

router.afterEach((to) => {
  if (!to.path.startsWith('/post/') && !to.path.startsWith('/releases/')) document.title = 'Eduport Tech Blog'
})

// iOS only shows :active (the press squeeze) on pages that listen for touches.
addEventListener('touchstart', () => {}, { passive: true })

createApp(App).use(router).mount('#app')
