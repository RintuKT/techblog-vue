<script setup>
defineProps({ images: { type: Array, required: true }, size: { type: String, default: 'm' } })
</script>

<template>
  <div class="screens" :class="size">
    <a v-for="(img, i) in images" :key="i" class="screen" :href="img.url" target="_blank" rel="noopener" :title="img.caption || 'Open image'">
      <img :src="img.url" :alt="img.caption || ''" loading="lazy" />
      <span v-if="img.caption" class="cap">{{ img.caption }}</span>
    </a>
  </div>
</template>
