<script setup>
import { computed } from 'vue'
import { formatDate } from '../lib/content.js'
import ScreenStrip from './ScreenStrip.vue'
import Icon from './Icon.vue'
const props = defineProps({ release: { type: Object, required: true }, showProduct: { type: Boolean, default: true } })
// A plain release needs no label; major changes, hotfixes and betas do.
const showType = computed(() => props.release.type !== 'release')
</script>

<template>
  <article class="rel" @pointerenter="release.loadHtml()" @focusin="release.loadHtml()">
    <div class="rel-side">
      <div class="ver">{{ release.version }}</div>
      <time :datetime="release.date">{{ formatDate(release.date, false) }}</time>
    </div>
    <div class="rel-main">
      <div v-if="showProduct || showType" class="rel-chips">
        <router-link v-if="showProduct" class="chip" :to="{ path: '/releases', query: { product: release.productKey } }">{{ release.product.name }}</router-link>
        <span v-if="showType" class="chip filled" :class="'type-' + release.type">{{ release.typeLabel }}</span>
      </div>
      <h2><router-link :to="`/releases/${release.slug}`">{{ release.title }}</router-link></h2>
      <p class="sum">{{ release.summary }}</p>
      <ScreenStrip v-if="release.images.length" :images="release.images" size="s" />
      <div class="rel-foot">
        <router-link :to="`/releases/${release.slug}`">{{ release.hasBody ? 'Full notes' : 'Details' }}<Icon name="arrow-right" :size="15" /></router-link>
        <a v-for="l in release.links" :key="l.url" class="ext" :href="l.url" target="_blank" rel="noopener">
          <Icon v-if="l.icon" :name="l.icon" :size="16" />{{ l.label }}<Icon v-if="!l.icon" name="external" :size="14" />
        </a>
        <span v-if="release.author" class="by">by {{ release.author.name }}</span>
      </div>
    </div>
  </article>
</template>
