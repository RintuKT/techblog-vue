<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { posts, usedAuthors, usedCategories, allTags, tagCounts, featuredPosts, formatDate } from '../lib/content.js'
import { releases } from '../lib/releases.js'
import { byDay, dayMap, releaseLabel, longDate } from '../lib/activity.js'
import PostCard from '../components/PostCard.vue'
import Avatar from '../components/Avatar.vue'
import Icon from '../components/Icon.vue'
import ActivityCalendar from '../components/ActivityCalendar.vue'
import DayStrip from '../components/DayStrip.vue'

// The calendar sits in a left rail wherever there is room; on phones a week strip heads the feed instead and
// picks the day the list shows (?day). style.css picks one, so the page renders the same everywhere, build included.
const route = useRoute()
const router = useRouter()

const q = computed(() => String(route.query.q || ''))
const author = computed(() => String(route.query.author || ''))
const category = computed(() => String(route.query.category || ''))
const tag = computed(() => String(route.query.tag || ''))
// A writer, category or topic: one at a time, each from its own link.
const scoped = computed(() => Boolean(author.value || category.value || tag.value))
const inScope = (p) => (!author.value || p.authorKey === author.value) && (!category.value || p.category === category.value) && (!tag.value || p.tags.includes(tag.value))
// The phone calendar shows what the list can show: on a writer, category or topic page only its stories.
const stripDays = computed(() => (scoped.value ? dayMap(posts.filter(inScope), []) : byDay))
// A day with nothing on it (an old or hand-typed link) counts as no day.
const day = computed(() => (stripDays.value.has(String(route.query.day)) ? String(route.query.day) : ''))
const hasFilter = computed(() => Boolean(q.value || scoped.value || day.value))
// Typing a search or picking a day keeps the banner, so nothing above the field or the calendar moves.
const showBanner = computed(() => !scoped.value)
const authorEntry = computed(() => usedAuthors.find((a) => a.key === author.value))

function setQuery(patch) {
  const next = { ...route.query, ...patch }
  for (const k of Object.keys(next)) if (!next[k]) delete next[k]
  router.replace({ path: '/', query: next })
}

const needle = computed(() => q.value.trim().toLowerCase())
const filtered = computed(() =>
  posts.filter((p) => {
    if (!inScope(p)) return false
    if (day.value && p.date !== day.value) return false
    if (needle.value) {
      const hay = [p.title, p.summary, p.author.name, p.categoryLabel, ...p.tags].join(' ').toLowerCase()
      if (!hay.includes(needle.value)) return false
    }
    return true
  }),
)
// A picked day lists what shipped too, after its stories (a writer, category or topic has no releases).
const dayReleases = computed(() =>
  day.value && !scoped.value
    ? releases.filter((r) => r.date === day.value && (!needle.value || [r.title, r.summary, r.product.name, r.version].join(' ').toLowerCase().includes(needle.value)))
    : [],
)
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`
const countText = computed(() =>
  [filtered.value.length || !dayReleases.value.length ? count(filtered.value.length, 'story', 'stories') : '', dayReleases.value.length ? count(dayReleases.value.length, 'release', 'releases') : '']
    .filter(Boolean)
    .join(', '),
)

const filterLabel = computed(() => {
  if (author.value) return authorEntry.value?.name || author.value
  if (category.value) return usedCategories.find((c) => c.key === category.value)?.label || category.value
  if (tag.value) return `#${tag.value}`
  if (day.value) return longDate(day.value, { weekday: 'long', month: 'short', day: 'numeric' })
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
    <aside class="rail">
      <ActivityCalendar :day="day" @pick="(k) => setQuery({ day: k })" />
    </aside>

    <div class="feed">
      <DayStrip :days="stripDays" :day="day" @pick="(k) => setQuery({ day: k })" />

      <div class="label" :class="{ quiet: showBanner }">
        <Avatar v-if="authorEntry" :author="authorEntry" size="m" />
        <div>
          <h2>{{ hasFilter ? filterLabel : 'Latest stories' }}</h2>
          <div v-if="hasFilter" class="label-meta">
            <span>{{ countText }}</span>
            <button v-if="scoped && day" class="clear day-clear" type="button" aria-label="Clear day" @click="setQuery({ day: '' })"><Icon name="close" :size="14" />{{ longDate(day, { month: 'short', day: 'numeric' }) }}</button>
            <button class="clear" type="button" aria-label="Clear filters" @click="router.replace({ path: '/' })"><Icon name="close" :size="14" />Clear</button>
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
      <router-link v-for="r in dayReleases" :key="r.slug" class="day-rel" :to="`/releases/${r.slug}`" @pointerenter="r.loadHtml()" @focusin="r.loadHtml()">
        <Icon :name="r.product.icon || 'releases'" :size="20" />
        <span class="m"><span class="v">{{ releaseLabel(r) }}</span> <span v-if="r.type !== 'release'" class="chip filled" :class="`type-${r.type}`">{{ r.typeLabel }}</span></span>
        <span class="t">{{ r.title }}</span>
      </router-link>
      <p v-if="!filtered.length && !dayReleases.length" class="empty">No stories match.</p>

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
          <div class="who"><Avatar :author="p.author" size="s" />{{ p.author.name }} · {{ formatDate(p.date) }}</div>
          <div class="t">{{ p.title }}</div>
        </router-link>
      </section>
    </aside>
  </div>
</template>
