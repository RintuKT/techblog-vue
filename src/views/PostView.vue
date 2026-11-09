<script setup>
import { computed, ref, watch } from 'vue'
import { findPost, relatedPosts, formatDate } from '../lib/content.js'
import Avatar from '../components/Avatar.vue'

const props = defineProps({ slug: { type: String, required: true } })
const post = computed(() => findPost(props.slug))
const related = computed(() => (post.value ? relatedPosts(post.value, 3) : []))
const authorLink = computed(() => ({ path: '/', query: { author: post.value?.authorKey } }))

// The body is its own chunk, usually fetched already (on page load, or when the card was hovered or touched).
const html = ref('')
watch(post, async (p) => {
  const ready = p?.loadHtml.now()
  html.value = ready ?? ''
  if (!p || ready !== undefined) return
  const body = await p.loadHtml()
  if (post.value === p) html.value = body
}, { immediate: true })

</script>

<template>
  <article v-if="post" class="post read">
    <router-link v-if="post.categoryLabel" class="eyebrow" :to="{ path: '/', query: { category: post.category } }">{{ post.categoryLabel }}</router-link>

    <h1>{{ post.title }}</h1>

    <div class="byline">
      <Avatar :author="post.author" size="m" />
      <div>
        <router-link class="name" :to="authorLink">{{ post.author.name }}</router-link>
        <div class="sub sep">
          <time :datetime="post.date">{{ formatDate(post.date) }}</time>
          <span>{{ post.minutes }} min read</span>
        </div>
      </div>
    </div>

    <figure v-if="post.cover" class="cover">
      <img :src="post.cover" :alt="post.title" width="1200" height="675" fetchpriority="high" decoding="async" />
    </figure>

    <p v-if="post.summary" class="lede">{{ post.summary }}</p>

    <div class="prose" v-html="html"></div>

    <div v-if="post.tags.length" class="post-tags">
      <router-link v-for="t in post.tags" :key="t" class="chip filled" :to="{ path: '/', query: { tag: t } }">{{ t }}</router-link>
    </div>

    <div class="author-card">
      <Avatar :author="post.author" size="l" />
      <div>
        <div class="by">Written by</div>
        <router-link class="name" :to="authorLink">{{ post.author.name }}</router-link>
        <div class="role sep">
          <span v-if="post.author.role">{{ post.author.role }}</span>
          <span v-if="post.author.email">{{ post.author.email }}</span>
        </div>
        <div v-if="post.author.bio" class="bio">{{ post.author.bio }}</div>
      </div>
      <router-link class="pill" :to="authorLink">All posts</router-link>
    </div>

    <section v-if="related.length" class="more">
      <h3>More from the blog</h3>
      <div class="more-grid">
        <router-link v-for="r in related" :key="r.slug" class="more-item" :to="`/post/${r.slug}`" @pointerenter="r.loadHtml()">
          <img v-if="r.cover" class="thumb" :src="r.cover" alt="" loading="lazy" decoding="async" />
          <div class="t">{{ r.title }}</div>
          <div class="m">{{ r.author.name }} · {{ formatDate(r.date) }} · {{ r.minutes }} min</div>
        </router-link>
      </div>
    </section>
  </article>

  <p v-else class="empty">Post not found.</p>
</template>
