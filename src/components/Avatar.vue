<script setup>
import { computed } from 'vue'
const props = defineProps({
  author: { type: Object, required: true }, // an entry from authors.yaml: name, optional avatar photo
  size: { type: String, default: 's' },
})

// Without a photo a writer gets a monogram, like a contact card: the initials of the first and last word of the
// name ("Team" left out, so "Eduport Tech Team" reads ET and "Infrastructure Team" reads I), white on soft grey.
const initials = computed(() => {
  const words = String(props.author.name || '?').split(/\s+/).filter((w) => w && !/^team$/i.test(w))
  const first = words[0]?.[0] || '?'
  return (words.length > 1 ? first + words[words.length - 1][0] : first).toUpperCase()
})
</script>

<template>
  <img v-if="author.avatar" class="avatar" :class="size" :src="author.avatar" alt="" loading="lazy" decoding="async" />
  <span v-else class="avatar mono" :class="size" aria-hidden="true">{{ initials }}</span>
</template>
