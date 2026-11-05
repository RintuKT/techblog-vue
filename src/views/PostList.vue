<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { posts, usedAuthors, usedCategories, allTags, tagCounts, featuredPosts, formatDate } from '../lib/content.js'
import PostCard from '../components/PostCard.vue'
import Avatar from '../components/Avatar.vue'
import Icon from '../components/Icon.vue'
import ActivityCalendar from '../components/ActivityCalendar.vue'

// The calendar sits in a left rail wherever there is room; on phones it follows the stories.
const wideQuery = matchMedia('(min-width: 680px)')
const wide = ref(wideQuery.matches)
const onWide = (e) => { wide.value = e.matches }
onMounted(() => wideQuery.addEventListener('change', onWide))
onBeforeUnmount(() => wideQuery.removeEventListener('change', onWide))

const route = useRoute()
const router = useRouter()

const q = computed(() => String(route.query.q || ''))
const author = computed(() => String(route.query.author || ''))
const category = computed(() => String(route.query.category || ''))
const tag = computed(() => String(route.query.tag || ''))
const hasFilter = computed(() => Boolean(q.value || author.value || category.value || tag.value))
// Typing a search keeps the banner, so the field does not jump away from the cursor.
const showBanner = computed(() => !author.value && !category.value && !tag.value)
const authorEntry = computed(() => usedAuthors.find((a) => a.key === author.value))

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
  if (author.value) return authorEntry.value?.name || author.value
  if (category.value) return usedCategories.find((c) => c.key === category.value)?.label || category.value
  if (tag.value) return `#${tag.value}`
  if (q.value) return `“${q.value}”`
  return ''
})
</script>

<template>
  <section class="pub-banner wrap" v-if="showBanner">
    <h1>Eduport Tech Blog. <span>What we build and learn.</span></h1>
    <div class="stats">
      <span><b>{{ posts.length }}</b>stories</span>
      <span><b>{{ usedAuthors.length }}</b>writers</span>
      <span><b>{{ allTags.length }}</b>topics</span>
    </div>
  </section>

  <div class="home wrap">
    <aside v-if="wide" class="rail">
      <ActivityCalendar />
    </aside>

    <div class="feed">
      <div class="label">
        <Avatar v-if="authorEntry" :author="authorEntry" size="m" />
        <div>
          <h2>{{ hasFilter ? filterLabel : 'Latest stories' }}</h2>
          <div v-if="hasFilter" class="label-meta">
            <span>{{ filtered.length }} {{ filtered.length === 1 ? 'story' : 'stories' }}</span>
            <button class="clear" type="button" @click="router.replace({ path: '/' })"><Icon name="close" :size="14" />Clear</button>
          </div>
        </div>
      </div>

      <div class="filters">
        <div class="search">
          <Icon name="search" :size="18" />
          <input type="search" placeholder="Search stories" :value="q" @input="setQuery({ q: $event.target.value })" aria-label="Search stories" enterkeyhint="search" />
          <button v-if="q" class="search-clear" type="button" aria-label="Clear search" @click="setQuery({ q: '' })"><Icon name="close" :size="16" /></button>
        </div>
      </div>

      <PostCard v-for="p in filtered" :key="p.slug" :post="p" />
      <p v-if="filtered.length === 0" class="empty">No stories match.</p>

      <div v-if="!wide" class="rail-inline">
        <ActivityCalendar />
      </div>

      <section class="browse">
        <h3>Categories</h3>
        <div class="chips">
          <router-link v-for="c in usedCategories" :key="c.key" class="chip filled" :class="{ on: category === c.key }" :to="{ path: '/', query: { category: c.key } }">{{ c.label }}</router-link>
        </div>
        <h3>Topics</h3>
        <div class="chips">
          <router-link v-for="t in tagCounts" :key="t.tag" class="chip filled" :class="{ on: tag === t.tag }" :to="{ path: '/', query: { tag: t.tag } }">{{ t.tag }}</router-link>
        </div>
      </section>
    </div>

    <aside class="sidebar">
      <section class="side-featured">
        <h3>Featured</h3>
        <router-link v-for="p in featuredPosts" :key="p.slug" class="side-post" :to="`/post/${p.slug}`">
          <div class="who"><Avatar :author="p.author" size="s" />{{ p.author.name }} · {{ formatDate(p.date, false) }}</div>
          <div class="t">{{ p.title }}</div>
        </router-link>
      </section>
    </aside>
  </div>
</template>
