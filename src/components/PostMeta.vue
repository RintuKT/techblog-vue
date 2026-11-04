<script setup>
import { formatDate } from '../lib/content.js'
defineProps({ post: { type: Object, required: true }, showAuthor: { type: Boolean, default: true } })
</script>

<template>
  <div class="meta">
    <time :datetime="post.date">{{ formatDate(post.date) }}</time>
    <router-link v-if="showAuthor" :to="{ path: '/', query: { author: post.authorKey } }">{{ post.author.name }}</router-link>
    <router-link v-if="post.categoryLabel" class="cat" :to="{ path: '/', query: { category: post.category } }">{{ post.categoryLabel }}</router-link>
    <span>{{ post.minutes }} min read</span>
  </div>
</template>
