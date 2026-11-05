<script setup>
import { computed, ref, watch } from 'vue'
import { findRelease, releases } from '../lib/releases.js'
import { formatDate } from '../lib/content.js'
import ScreenStrip from '../components/ScreenStrip.vue'
import Icon from '../components/Icon.vue'

const props = defineProps({ slug: { type: String, required: true } })
const rel = computed(() => findRelease(props.slug))
const siblings = computed(() => {
  if (!rel.value) return { newer: null, older: null }
  const list = releases.filter((r) => r.productKey === rel.value.productKey)
  const i = list.findIndex((r) => r.slug === rel.value.slug)
  return { newer: list[i - 1] || null, older: list[i + 1] || null }
})
// The notes are their own chunk, fetched on open (or when the card was hovered or touched).
const html = ref('')
watch(rel, async (r) => {
  const ready = r?.loadHtml.now()
  html.value = ready ?? ''
  if (!r || ready !== undefined) return
  const body = await r.loadHtml()
  if (rel.value === r) html.value = body
}, { immediate: true })
</script>

<template>
  <article v-if="rel" class="post read release-page">
    <div class="tags-row">
      <router-link class="chip" to="/releases"><Icon name="arrow-left" :size="14" />Releases</router-link>
      <router-link class="chip" :to="{ path: '/releases', query: { product: rel.productKey } }">{{ rel.product.name }}</router-link>
      <span v-if="rel.type !== 'release'" class="chip filled" :class="'type-' + rel.type">{{ rel.typeLabel }}</span>
    </div>

    <div class="ver-big">{{ rel.version }}</div>
    <h1>{{ rel.title }}</h1>
    <div class="rel-meta">
      <time :datetime="rel.date">{{ formatDate(rel.date) }}</time>
      <span v-if="rel.author">{{ rel.author.name }}</span>
      <a v-for="l in rel.links" :key="l.url" class="ext" :href="l.url" target="_blank" rel="noopener">
        <Icon v-if="l.icon" :name="l.icon" :size="16" />{{ l.label }}<Icon v-if="!l.icon" name="external" :size="14" />
      </a>
    </div>

    <p v-if="rel.summary" class="lede">{{ rel.summary }}</p>

    <ScreenStrip v-if="rel.images.length" :images="rel.images" size="m" />

    <div class="prose" v-html="html"></div>

    <nav v-if="siblings.older || siblings.newer" class="rel-nav">
      <router-link v-if="siblings.older" class="older" :to="`/releases/${siblings.older.slug}`">
        <Icon name="arrow-left" :size="16" /><span>{{ siblings.older.version }} · {{ siblings.older.title }}</span>
      </router-link>
      <router-link v-if="siblings.newer" class="newer" :to="`/releases/${siblings.newer.slug}`">
        <span>{{ siblings.newer.version }} · {{ siblings.newer.title }}</span><Icon name="arrow-right" :size="16" />
      </router-link>
    </nav>
  </article>
  <p v-else class="empty">Release not found.</p>
</template>
