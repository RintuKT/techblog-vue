<script setup>
import { formatDate } from '../lib/content.js'
import { isSaved, toggleSaved } from '../lib/saved.js'
import Avatar from './Avatar.vue'
import Icon from './Icon.vue'
defineProps({ post: { type: Object, required: true } })
</script>

<template>
  <article class="card">
    <div>
      <div class="who">
        <Avatar :name="post.author.name" size="s" />
        <router-link :to="{ path: '/', query: { author: post.authorKey } }"><b>{{ post.author.name }}</b></router-link>
        <span>·</span>
        <time :datetime="post.date">{{ formatDate(post.date, false) }}</time>
      </div>
      <h2><router-link :to="`/post/${post.slug}`">{{ post.title }}</router-link></h2>
      <p>{{ post.summary }}</p>
      <div class="foot">
        <router-link class="chip filled" :to="{ path: '/', query: { category: post.category } }">{{ post.categoryLabel }}</router-link>
        <span>{{ post.minutes }} min read</span>
        <span class="right">
          <button class="icon-btn" :title="isSaved(post.slug) ? 'Remove from saved' : 'Save'" @click="toggleSaved(post.slug)">
            <Icon :name="isSaved(post.slug) ? 'bookmark-filled' : 'bookmark'" />
          </button>
        </span>
      </div>
    </div>
    <router-link v-if="post.cover" class="thumb-wrap" :to="`/post/${post.slug}`">
      <img class="thumb" :src="post.cover" alt="" loading="lazy" />
    </router-link>
  </article>
</template>
