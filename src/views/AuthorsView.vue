<script setup>
import { usedAuthors } from '../lib/content.js'
import Avatar from '../components/Avatar.vue'
</script>

<template>
  <div class="read">
    <h1 class="page-title">Writers</h1>
    <div v-for="a in usedAuthors" :key="a.key" class="author-row">
      <Avatar :name="a.name" size="m" />
      <div class="who">
        <router-link class="n" :to="{ path: '/', query: { author: a.key } }">{{ a.name }}</router-link>
        <span>{{ [a.role, a.email].filter(Boolean).join(' · ') }}</span>
      </div>
      <div class="count">{{ a.count }} {{ a.count === 1 ? 'story' : 'stories' }}</div>
    </div>
  </div>
</template>
