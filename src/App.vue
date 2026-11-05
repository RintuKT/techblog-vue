<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { theme, toggleTheme } from './lib/theme.js'
import Icon from './components/Icon.vue'
import logo from './assets/eduport-logo.png'

const route = useRoute()
const router = useRouter()
// One list drives the header nav (tablet and up) and the bottom tab bar (phones).
const sections = [
  { to: '/', label: 'Stories', icon: 'stories', match: (p) => p === '/' || p.startsWith('/post/') },
  { to: '/releases', label: 'Releases', icon: 'releases', match: (p) => p.startsWith('/releases') },
  { to: '/authors', label: 'Writers', icon: 'writers', match: (p) => p.startsWith('/authors') },
]
const current = computed(() => sections.findIndex((s) => s.match(route.path)))

// The header highlight only ever moves sideways (CSS works out where from the index), so the browser
// glides it on its own thread even while the next page renders. It sets off on press, not on release.
const pressed = ref(-1)
const pillAt = computed(() => (pressed.value >= 0 ? pressed.value : current.value))
router.afterEach(() => { pressed.value = -1 })
function press(i, e) {
  if (e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
  pressed.value = i
  const link = e.currentTarget
  const end = (ev) => {
    removeEventListener('pointerup', end, true)
    removeEventListener('pointercancel', end, true)
    // A press that ends off the link (or is cancelled) navigates nowhere, so the highlight goes back.
    if (ev.type === 'pointercancel' || !(ev.target instanceof Node && link.contains(ev.target))) pressed.value = -1
  }
  addEventListener('pointerup', end, true)
  addEventListener('pointercancel', end, true)
}
// No glide on the first paint, only on changes after it.
const pillMoves = ref(false)
onMounted(() => router.isReady().then(() => requestAnimationFrame(() => { pillMoves.value = true })))
</script>

<template>
  <header class="site-header">
    <div class="wrap">
      <router-link to="/" class="brand"><img class="mark" :src="logo" alt="Eduport" width="28" height="28" />Eduport Tech</router-link>
      <nav class="nav" aria-label="Sections" :style="{ '--n': sections.length, '--i': pillAt }">
        <span v-show="pillAt >= 0" class="nav-pill" :class="{ moves: pillMoves }" aria-hidden="true"></span>
        <router-link v-for="(s, i) in sections" :key="s.to" :to="s.to" :class="{ on: i === pillAt }" @pointerdown="press(i, $event)">{{ s.label }}</router-link>
      </nav>
      <button
        class="icon-btn theme-btn"
        :title="theme === 'dark' ? 'Switch to light' : 'Switch to dark'"
        :aria-label="theme === 'dark' ? 'Switch to light' : 'Switch to dark'"
        @click="toggleTheme"
      >
        <Transition name="swap">
          <Icon :key="theme" :name="theme === 'dark' ? 'sun' : 'moon'" />
        </Transition>
      </button>
    </div>
  </header>

  <main>
    <router-view />
  </main>

  <footer class="site-footer">
    <div class="wrap">
      <span>Eduport engineering</span>
    </div>
  </footer>

  <nav class="tabbar" aria-label="Sections">
    <router-link v-for="(s, i) in sections" :key="s.to" :to="s.to" :class="{ on: i === pillAt }" @pointerdown="press(i, $event)">
      <Icon :name="s.icon" :size="20" :stroke-width="i === pillAt ? 2 : 1.5" />
      <span>{{ s.label }}</span>
    </router-link>
  </nav>
</template>
