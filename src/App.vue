<script setup>
import { posts } from './lib/content.js'
</script>

<template>
  <header class="site-header">
    <div class="wrap">
      <router-link to="/" class="brand">Eduport Tech Blog <small>internal</small></router-link>
      <nav class="nav">
        <router-link to="/">Posts</router-link>
        <router-link to="/authors">Authors</router-link>
      </nav>
    </div>
  </header>

  <main>
    <div class="wrap">
      <router-view />
    </div>
  </main>

  <footer class="site-footer">
    <div class="wrap">Eduport engineering · {{ posts.length }} posts · internal use only</div>
  </footer>
</template>
