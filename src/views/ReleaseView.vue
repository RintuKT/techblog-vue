<script setup>
import { computed, watchEffect } from 'vue'
import { findRelease, releases } from '../lib/releases.js'
import { formatDate } from '../lib/content.js'
import ScreenStrip from '../components/ScreenStrip.vue'

const props = defineProps({ slug: { type: String, required: true } })
const rel = computed(() => findRelease(props.slug))
const siblings = computed(() => {
  if (!rel.value) return { prev: null, next: null }
  const list = releases.filter((r) => r.productKey === rel.value.productKey)
  const i = list.findIndex((r) => r.slug === rel.value.slug)
  return { newer: list[i - 1] || null, older: list[i + 1] || null }
})
watchEffect(() => {
  document.title = rel.value ? `${rel.value.product.name} ${rel.value.version} · Eduport Tech Blog` : 'Eduport Tech Blog'
})
</script>

<template>
  <article v-if="rel" class="post read release-page">
    <div class="tags-row">
      <router-link class="chip" to="/releases">Releases</router-link>
      <router-link class="chip" :to="{ path: '/releases', query: { product: rel.productKey } }">{{ rel.product.name }}</router-link>
      <span class="chip filled" :class="'type-' + rel.type">{{ rel.typeLabel }}</span>
    </div>

    <div class="ver-big">{{ rel.version }}</div>
    <h1>{{ rel.title }}</h1>
    <div class="rel-meta">
      <time :datetime="rel.date">{{ formatDate(rel.date) }}</time>
      <span v-if="rel.author">{{ rel.author.name }}</span>
      <a v-for="l in rel.links" :key="l.url" :href="l.url" target="_blank" rel="noopener">{{ l.label }} ↗</a>
    </div>

    <p v-if="rel.summary" class="lede">{{ rel.summary }}</p>

    <ScreenStrip v-if="rel.images.length" :images="rel.images" size="m" />

    <div class="prose" v-html="rel.html"></div>

    <nav class="rel-nav">
      <router-link v-if="siblings.older" :to="`/releases/${siblings.older.slug}`">← {{ siblings.older.version }} · {{ siblings.older.title }}</router-link>
      <span v-else></span>
      <router-link v-if="siblings.newer" :to="`/releases/${siblings.newer.slug}`">{{ siblings.newer.version }} · {{ siblings.newer.title }} →</router-link>
    </nav>
  </article>
  <p v-else class="empty">Release not found.</p>
</template>
