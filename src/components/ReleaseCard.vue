<script setup>
import { formatDate } from '../lib/content.js'
import ScreenStrip from './ScreenStrip.vue'
defineProps({ release: { type: Object, required: true }, showProduct: { type: Boolean, default: true } })
</script>

<template>
  <article class="rel">
    <div class="rel-side">
      <div class="ver">{{ release.version }}</div>
      <time :datetime="release.date">{{ formatDate(release.date) }}</time>
    </div>
    <div class="rel-main">
      <div class="rel-chips">
        <router-link v-if="showProduct" class="chip" :to="{ path: '/releases', query: { product: release.productKey } }">{{ release.product.name }}</router-link>
        <span class="chip filled" :class="'type-' + release.type">{{ release.typeLabel }}</span>
      </div>
      <h2><router-link :to="`/releases/${release.slug}`">{{ release.title }}</router-link></h2>
      <p class="sum">{{ release.summary }}</p>
      <ScreenStrip v-if="release.images.length" :images="release.images" size="s" />
      <div class="rel-foot">
        <router-link :to="`/releases/${release.slug}`">{{ release.hasBody ? 'Full notes' : 'Details' }} →</router-link>
        <a v-for="l in release.links" :key="l.url" :href="l.url" target="_blank" rel="noopener">{{ l.label }} ↗</a>
        <span v-if="release.author" class="by">by {{ release.author.name }}</span>
      </div>
    </div>
  </article>
</template>
