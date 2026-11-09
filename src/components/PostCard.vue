<script setup>
import { formatDate } from '../lib/content.js'
import Avatar from './Avatar.vue'
defineProps({ post: { type: Object, required: true } })
</script>

<template>
  <article class="card" @pointerenter="post.loadHtml()" @focusin="post.loadHtml()">
    <div class="who">
      <Avatar :author="post.author" size="s" />
      <router-link :to="{ path: '/', query: { author: post.authorKey } }"><b>{{ post.author.name }}</b></router-link>
      <span aria-hidden="true">·</span>
      <time :datetime="post.date">{{ formatDate(post.date) }}</time>
    </div>
    <div class="body">
      <div>
        <h2><router-link :to="`/post/${post.slug}`">{{ post.title }}</router-link></h2>
        <p>{{ post.summary }}</p>
      </div>
      <router-link v-if="post.cover" class="thumb-wrap" :to="`/post/${post.slug}`" tabindex="-1" aria-hidden="true">
        <img class="thumb" :src="post.cover" alt="" loading="lazy" decoding="async" />
      </router-link>
    </div>
    <div class="foot">
      <router-link class="chip filled" :to="{ path: '/', query: { category: post.category } }">{{ post.categoryLabel }}</router-link>
      <span>{{ post.minutes }} min read</span>
    </div>
  </article>
</template>
