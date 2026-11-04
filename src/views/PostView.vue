<script setup>
import { computed, watchEffect } from 'vue'
import { findPost } from '../lib/content.js'
import PostMeta from '../components/PostMeta.vue'

const props = defineProps({ slug: { type: String, required: true } })
const post = computed(() => findPost(props.slug))

const initials = computed(() =>
  (post.value?.author.name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

watchEffect(() => {
  document.title = post.value ? `${post.value.title} · Eduport Tech Blog` : 'Eduport Tech Blog'
})
</script>

<template>
  <router-link to="/" class="back">← All posts</router-link>

  <template v-if="post">
    <header class="post-header">
      <h1>{{ post.title }}</h1>
      <PostMeta :post="post" :show-author="false" />
      <p v-if="post.summary" class="summary">{{ post.summary }}</p>
    </header>

    <div class="byline">
      <div class="avatar" aria-hidden="true">{{ initials }}</div>
      <div class="who">
        <router-link :to="{ path: '/', query: { author: post.authorKey } }">{{ post.author.name }}</router-link>
        <span>{{ [post.author.role, post.author.email].filter(Boolean).join(' · ') }}</span>
      </div>
    </div>

    <div class="prose" v-html="post.html"></div>

    <footer v-if="post.tags.length" class="post-footer">
      Tags:
      <template v-for="(t, i) in post.tags" :key="t">
        <router-link class="tag" :to="{ path: '/', query: { tag: t } }">{{ t }}</router-link><span v-if="i < post.tags.length - 1">, </span>
      </template>
    </footer>
  </template>

  <p v-else class="empty">Post not found.</p>
</template>
