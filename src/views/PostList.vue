<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { posts, usedAuthors, usedCategories, allTags } from '../lib/content.js'
import PostMeta from '../components/PostMeta.vue'

const route = useRoute()
const router = useRouter()

const q = computed(() => String(route.query.q || ''))
const author = computed(() => String(route.query.author || ''))
const category = computed(() => String(route.query.category || ''))
const tag = computed(() => String(route.query.tag || ''))

function setQuery(patch) {
  const next = { ...route.query, ...patch }
  for (const k of Object.keys(next)) if (!next[k]) delete next[k]
  router.replace({ path: '/', query: next })
}

const hasFilter = computed(() => q.value || author.value || category.value || tag.value)

const filtered = computed(() => {
  const needle = q.value.trim().toLowerCase()
  return posts.filter((p) => {
    if (author.value && p.authorKey !== author.value) return false
    if (category.value && p.category !== category.value) return false
    if (tag.value && !p.tags.includes(tag.value)) return false
    if (needle) {
      const hay = [p.title, p.summary, p.author.name, ...p.tags].join(' ').toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })
})
</script>

<template>
  <div class="filters">
    <input
      type="search"
      placeholder="Search posts"
      :value="q"
      @input="setQuery({ q: $event.target.value })"
      aria-label="Search posts"
    />
    <select :value="author" @change="setQuery({ author: $event.target.value })" aria-label="Filter by author">
      <option value="">All authors</option>
      <option v-for="a in usedAuthors" :key="a.key" :value="a.key">{{ a.name }} ({{ a.count }})</option>
    </select>
    <select :value="category" @change="setQuery({ category: $event.target.value })" aria-label="Filter by category">
      <option value="">All categories</option>
      <option v-for="c in usedCategories" :key="c.key" :value="c.key">{{ c.label }} ({{ c.count }})</option>
    </select>
    <select :value="tag" @change="setQuery({ tag: $event.target.value })" aria-label="Filter by tag">
      <option value="">All tags</option>
      <option v-for="t in allTags" :key="t" :value="t">{{ t }}</option>
    </select>
    <button v-if="hasFilter" class="clear" @click="router.replace({ path: '/' })">Clear</button>
  </div>

  <p v-if="hasFilter" class="active-filter">
    {{ filtered.length }} {{ filtered.length === 1 ? 'post' : 'posts' }}
    <template v-if="tag"> tagged <b>{{ tag }}</b></template>
  </p>

  <article v-for="p in filtered" :key="p.slug" class="post-item">
    <h2><router-link :to="`/post/${p.slug}`">{{ p.title }}</router-link></h2>
    <p>{{ p.summary }}</p>
    <PostMeta :post="p" />
  </article>

  <p v-if="filtered.length === 0" class="empty">No posts match these filters.</p>
</template>
