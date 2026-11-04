<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { posts, usedAuthors, usedCategories, allTags, tagCounts, featuredPosts, formatDate } from '../lib/content.js'
import PostCard from '../components/PostCard.vue'
import Avatar from '../components/Avatar.vue'

const route = useRoute()
const router = useRouter()

const q = computed(() => String(route.query.q || ''))
const author = computed(() => String(route.query.author || ''))
const category = computed(() => String(route.query.category || ''))
const tag = computed(() => String(route.query.tag || ''))
const hasFilter = computed(() => Boolean(q.value || author.value || category.value || tag.value))

function setQuery(patch) {
  const next = { ...route.query, ...patch }
  for (const k of Object.keys(next)) if (!next[k]) delete next[k]
  router.replace({ path: '/', query: next })
}

const filtered = computed(() => {
  const needle = q.value.trim().toLowerCase()
  return posts.filter((p) => {
    if (author.value && p.authorKey !== author.value) return false
    if (category.value && p.category !== category.value) return false
    if (tag.value && !p.tags.includes(tag.value)) return false
    if (needle) {
      const hay = [p.title, p.summary, p.author.name, p.categoryLabel, ...p.tags].join(' ').toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })
})

const filterLabel = computed(() => {
  if (author.value) return usedAuthors.find((a) => a.key === author.value)?.name || author.value
  if (category.value) return usedCategories.find((c) => c.key === category.value)?.label || category.value
  if (tag.value) return `#${tag.value}`
  if (q.value) return `“${q.value}”`
  return ''
})
</script>

<template>
  <section class="pub-banner wrap" v-if="!hasFilter">
    <h1>Eduport Tech Blog</h1>
    <p>What we shipped, what we improved, what we tried, and what it cost. Written by the people who did the work.</p>
    <div class="stats">
      <span><b>{{ posts.length }}</b>stories</span>
      <span><b>{{ usedAuthors.length }}</b>writers</span>
      <span><b>{{ allTags.length }}</b>topics</span>
    </div>
  </section>

  <div class="home wrap">
    <div class="label">
      <template v-if="hasFilter">{{ filterLabel }}<small>{{ filtered.length }} {{ filtered.length === 1 ? 'story' : 'stories' }} · <a href="#/" @click.prevent="router.replace({ path: '/' })">clear</a></small></template>
      <template v-else>Latest stories</template>
    </div>

    <div class="feed">
      <div class="filters">
        <input type="search" placeholder="Search stories" :value="q" @input="setQuery({ q: $event.target.value })" aria-label="Search" />
        <select :value="author" @change="setQuery({ author: $event.target.value })" aria-label="Author">
          <option value="">All writers</option>
          <option v-for="a in usedAuthors" :key="a.key" :value="a.key">{{ a.name }}</option>
        </select>
        <select :value="category" @change="setQuery({ category: $event.target.value })" aria-label="Category">
          <option value="">All categories</option>
          <option v-for="c in usedCategories" :key="c.key" :value="c.key">{{ c.label }}</option>
        </select>
        <select :value="tag" @change="setQuery({ tag: $event.target.value })" aria-label="Tag">
          <option value="">All topics</option>
          <option v-for="t in allTags" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <PostCard v-for="p in filtered" :key="p.slug" :post="p" />
      <p v-if="filtered.length === 0" class="empty">No stories match.</p>
    </div>

    <aside class="sidebar">
      <section>
        <h3>Featured</h3>
        <router-link v-for="p in featuredPosts" :key="p.slug" class="side-post" :to="`/post/${p.slug}`">
          <div class="who"><Avatar :name="p.author.name" size="s" />{{ p.author.name }} · {{ formatDate(p.date, false) }}</div>
          <div class="t">{{ p.title }}</div>
        </router-link>
      </section>
      <section>
        <h3>Categories</h3>
        <router-link v-for="c in usedCategories" :key="c.key" class="side-row" :to="{ path: '/', query: { category: c.key } }">
          {{ c.label }}<span class="n">{{ c.count }}</span>
        </router-link>
      </section>
      <section>
        <h3>Writers</h3>
        <router-link v-for="a in usedAuthors" :key="a.key" class="side-row" :to="{ path: '/', query: { author: a.key } }">
          <Avatar :name="a.name" size="s" />{{ a.name }}<span class="n">{{ a.count }}</span>
        </router-link>
      </section>
      <section>
        <h3>Topics</h3>
        <div class="chips">
          <router-link v-for="t in tagCounts" :key="t.tag" class="chip" :to="{ path: '/', query: { tag: t.tag } }">{{ t.tag }}</router-link>
        </div>
      </section>
    </aside>
  </div>
</template>
