import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import PostList from './views/PostList.vue'
import PostView from './views/PostView.vue'
import AuthorsView from './views/AuthorsView.vue'
import SavedView from './views/SavedView.vue'
import './style.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: PostList },
    { path: '/post/:slug', component: PostView, props: true },
    { path: '/authors', component: AuthorsView },
    { path: '/saved', component: SavedView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: (to, from) => (to.path === from.path ? undefined : { top: 0 }),
})

router.afterEach((to) => {
  if (!to.path.startsWith('/post/')) document.title = 'Eduport Tech Blog'
})

createApp(App).use(router).mount('#app')
