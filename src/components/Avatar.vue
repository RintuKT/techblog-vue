<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'
const props = defineProps({
  author: { type: Object, required: true }, // an entry from authors.yaml: name, optional badge + color, or avatar photo
  size: { type: String, default: 's' },
})

// A writer with a badge gets a light one: a pale circle in their colour, a graduation cap (the Eduport motif) and
// their word under it (TECH, INFRA); the smallest size shows the cap alone. Without a badge or a photo, a monogram:
// the initials of the first and last word of the name ("Team" left out), white on soft grey.
const capSize = { s: 13, m: 18, l: 23 }
const initials = computed(() => {
  const words = String(props.author.name || '?').split(/\s+/).filter((w) => w && !/^team$/i.test(w))
  const first = words[0]?.[0] || '?'
  return (words.length > 1 ? first + words[words.length - 1][0] : first).toUpperCase()
})
</script>

<template>
  <img v-if="author.avatar" class="avatar" :class="size" :src="author.avatar" alt="" loading="lazy" decoding="async" />
  <span v-else-if="author.badge" class="avatar badge" :class="size" :style="{ '--wc': author.color || '#8a8a8a' }" aria-hidden="true">
    <Icon name="cap" :size="capSize[size] || 18" :stroke-width="1.6" />
    <b v-if="size !== 's'">{{ author.badge }}</b>
  </span>
  <span v-else class="avatar mono" :class="size" aria-hidden="true">{{ initials }}</span>
</template>
