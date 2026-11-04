<script setup>
import { usedAuthors } from '../lib/content.js'
function initials(name) {
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}
</script>

<template>
  <div v-for="a in usedAuthors" :key="a.key" class="author-row">
    <div class="avatar" aria-hidden="true">{{ initials(a.name) }}</div>
    <div class="who">
      <router-link :to="{ path: '/', query: { author: a.key } }">{{ a.name }}</router-link>
      <span>{{ [a.role, a.email].filter(Boolean).join(' · ') }}</span>
    </div>
    <div class="count">{{ a.count }} {{ a.count === 1 ? 'post' : 'posts' }}</div>
  </div>
</template>
