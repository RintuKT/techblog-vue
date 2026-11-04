<script setup>
import { computed, ref, watchEffect } from 'vue'
import { findPost, relatedPosts, formatDate } from '../lib/content.js'
import { isSaved, toggleSaved } from '../lib/saved.js'
import Avatar from '../components/Avatar.vue'
import Icon from '../components/Icon.vue'

const props = defineProps({ slug: { type: String, required: true } })
const post = computed(() => findPost(props.slug))
const related = computed(() => (post.value ? relatedPosts(post.value, 3) : []))
const toast = ref('')

watchEffect(() => {
  document.title = post.value ? `${post.value.title} · Eduport Tech Blog` : 'Eduport Tech Blog'
})

async function copyLink() {
  try {
    await navigator.clipboard.writeText(location.href)
    toast.value = 'Link copied'
  } catch {
    toast.value = location.href
  }
  setTimeout(() => (toast.value = ''), 2000)
}

async function share() {
  if (navigator.share && post.value) {
    try { await navigator.share({ title: post.value.title, url: location.href }) } catch {}
  } else {
    copyLink()
  }
}
</script>

<template>
  <article v-if="post" class="post read">
    <div class="tags-row">
      <router-link class="chip" :to="{ path: '/', query: { category: post.category } }">{{ post.categoryLabel }}</router-link>
      <router-link v-for="t in post.tags" :key="t" class="chip" :to="{ path: '/', query: { tag: t } }">{{ t }}</router-link>
    </div>

    <h1>{{ post.title }}</h1>

    <div class="byline">
      <Avatar :name="post.author.name" size="m" />
      <div>
        <div class="name">
          <router-link :to="{ path: '/', query: { author: post.authorKey } }">{{ post.author.name }}</router-link>
          <router-link class="pill" style="margin-left: 12px" :to="{ path: '/', query: { author: post.authorKey } }">More posts</router-link>
        </div>
        <div class="sub">
          <span v-if="post.author.role">{{ post.author.role }}</span>
          <span>{{ post.minutes }} min read</span>
          <span>{{ formatDate(post.date) }}</span>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="act" :class="{ on: isSaved(post.slug) }" @click="toggleSaved(post.slug)">
        <Icon :name="isSaved(post.slug) ? 'bookmark-filled' : 'bookmark'" />
        {{ isSaved(post.slug) ? 'Saved' : 'Save' }}
      </button>
      <button class="act" @click="copyLink"><Icon name="link" /> Copy link</button>
      <span class="toast" aria-live="polite">{{ toast }}</span>
      <span class="right">
        <span class="act" :title="post.file"><Icon name="file" /> {{ post.file.split('/').pop() }}</span>
        <button class="act" title="Share" @click="share"><Icon name="share" /></button>
      </span>
    </div>

    <figure v-if="post.cover" class="cover">
      <img :src="post.cover" :alt="post.title" />
    </figure>

    <p v-if="post.summary" class="lede">{{ post.summary }}</p>

    <div class="prose" v-html="post.html"></div>

    <div v-if="post.tags.length" class="post-tags">
      <router-link v-for="t in post.tags" :key="t" class="chip filled" :to="{ path: '/', query: { tag: t } }">{{ t }}</router-link>
    </div>

    <div class="author-card">
      <Avatar :name="post.author.name" size="l" />
      <div>
        <div class="name">Written by {{ post.author.name }}</div>
        <div class="role">{{ [post.author.role, post.author.email].filter(Boolean).join(' · ') }}</div>
        <div v-if="post.author.bio" class="bio">{{ post.author.bio }}</div>
      </div>
      <router-link class="pill" :to="{ path: '/', query: { author: post.authorKey } }">All posts</router-link>
    </div>

    <section v-if="related.length" class="more">
      <h3>More from the blog</h3>
      <div class="more-grid">
        <router-link v-for="r in related" :key="r.slug" class="more-item" :to="`/post/${r.slug}`">
          <img v-if="r.cover" class="thumb" :src="r.cover" alt="" loading="lazy" />
          <div class="t">{{ r.title }}</div>
          <div class="m">{{ r.author.name }} · {{ formatDate(r.date, false) }} · {{ r.minutes }} min</div>
        </router-link>
      </div>
    </section>
  </article>

  <p v-else class="empty">Post not found.</p>
</template>
