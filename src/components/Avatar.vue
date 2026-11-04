<script setup>
import { computed } from 'vue'
import { initials } from '../lib/content.js'
const props = defineProps({ name: { type: String, required: true }, size: { type: String, default: 's' } })
// Stable muted colour per author name.
const bg = computed(() => {
  let h = 0
  for (const c of props.name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return `hsl(${h % 360} 38% 42%)`
})
</script>

<template>
  <span class="avatar" :class="size" :style="{ background: bg }" aria-hidden="true">{{ initials(name) }}</span>
</template>
