<script setup>
import { computed } from 'vue'
const props = defineProps({
  author: { type: Object, required: true }, // an entry from authors.yaml: name, optional avatar photo
  size: { type: String, default: 's' },
})

// Without a photo each writer gets a small abstract mark drawn from their name: a circle, a bar and a dot,
// placed by a hash of the name, so the same writer always gets the same mark. Monochrome, like the site.
const mark = computed(() => {
  let h = 2166136261
  for (const c of String(props.author.name || '')) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0
  const pick = (n) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0
    return h % n
  }
  return {
    disc: { cx: 6 + pick(24), cy: 6 + pick(24), r: 10 + pick(6) },
    bar: { y: 12 + pick(10), rot: pick(180) },
    dot: { cx: 9 + pick(18), cy: 9 + pick(18), r: 3 + pick(2) },
  }
})
</script>

<template>
  <img v-if="author.avatar" class="avatar" :class="size" :src="author.avatar" alt="" loading="lazy" decoding="async" />
  <span v-else class="avatar mark" :class="size" aria-hidden="true">
    <svg viewBox="0 0 36 36">
      <circle class="m-disc" :cx="mark.disc.cx" :cy="mark.disc.cy" :r="mark.disc.r" />
      <rect class="m-bar" x="-4" :y="mark.bar.y" width="44" height="5" rx="2.5" :transform="`rotate(${mark.bar.rot} 18 18)`" />
      <circle class="m-dot" :cx="mark.dot.cx" :cy="mark.dot.cy" :r="mark.dot.r" />
    </svg>
  </span>
</template>
