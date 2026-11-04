<script setup>
import { computed } from 'vue'
import { posts } from '../lib/content.js'
import { saved } from '../lib/saved.js'
import PostCard from '../components/PostCard.vue'
const list = computed(() => posts.filter((p) => saved.value.includes(p.slug)))
</script>

<template>
  <div class="read">
    <h1 class="page-title">Saved</h1>
    <PostCard v-for="p in list" :key="p.slug" :post="p" />
    <p v-if="list.length === 0" class="empty">Nothing saved yet. Use the bookmark icon on any story.</p>
  </div>
</template>
