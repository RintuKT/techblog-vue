<script setup>
import { usedAuthors } from '../lib/content.js'
import Avatar from '../components/Avatar.vue'
import Icon from '../components/Icon.vue'
</script>

<template>
  <div class="read authors">
    <h1 class="page-title">Writers</h1>
    <router-link v-for="a in usedAuthors" :key="a.key" class="author-row" :to="{ path: '/', query: { author: a.key } }">
      <Avatar :author="a" size="m" />
      <div class="who">
        <span class="n">{{ a.name }}</span>
        <span class="sep">
          <span v-if="a.role">{{ a.role }}</span>
          <span v-if="a.email">{{ a.email }}</span>
        </span>
      </div>
      <span class="count">{{ a.count }} {{ a.count === 1 ? 'story' : 'stories' }}</span>
      <Icon name="chevron-right" :size="16" />
    </router-link>
  </div>
</template>
