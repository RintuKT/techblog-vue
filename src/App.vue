<script setup>
import { theme, toggleTheme } from './lib/theme.js'
import { saved } from './lib/saved.js'
import Icon from './components/Icon.vue'
</script>

<template>
  <header class="site-header">
    <div class="wrap">
      <router-link to="/" class="brand"><span class="mark">E</span>Eduport Tech <small>internal</small></router-link>
      <nav class="nav">
        <router-link to="/">Stories</router-link>
        <router-link to="/authors">Writers</router-link>
        <router-link to="/saved">Saved<template v-if="saved.length"> ({{ saved.length }})</template></router-link>
        <button class="icon-btn" :title="theme === 'dark' ? 'Switch to light' : 'Switch to dark'" @click="toggleTheme">
          <Icon :name="theme === 'dark' ? 'sun' : 'moon'" />
        </button>
      </nav>
    </div>
  </header>

  <main>
    <router-view />
  </main>

  <footer class="site-footer">
    <div class="wrap">
      <span>Eduport engineering · internal use only</span>
      <span>Posts are Markdown files in content/posts</span>
    </div>
  </footer>
</template>
