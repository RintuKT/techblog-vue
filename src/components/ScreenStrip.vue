<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from './Icon.vue'
defineProps({ images: { type: Array, required: true }, size: { type: String, default: 'm' } })

// Screenshots scroll sideways with no scrollbar: the strip fades on any side with more to see,
// and on devices with a pointer, round arrows glide through it.
const scroller = ref(null)
const more = ref({ prev: false, next: false })
function measure() {
  const el = scroller.value
  if (!el) return
  const prev = el.scrollLeft > 2
  const next = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
  // Only a real change re-renders, not every scroll event
  if (prev !== more.value.prev || next !== more.value.next) more.value = { prev, next }
}
const step = (dir) => scroller.value?.scrollBy({ left: dir * scroller.value.clientWidth * 0.8, behavior: 'smooth' })
let observer
onMounted(() => {
  measure()
  observer = new ResizeObserver(measure)
  observer.observe(scroller.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="strip" :class="size">
    <div ref="scroller" class="screens" :class="{ 'fade-l': more.prev, 'fade-r': more.next }" @scroll.passive="measure">
      <a v-for="(img, i) in images" :key="i" class="screen" :href="img.url" target="_blank" rel="noopener" :title="img.caption || 'Open image'">
        <img :src="img.url" :alt="img.caption || ''" loading="lazy" decoding="async" @load="measure" />
        <span v-if="img.caption" class="cap">{{ img.caption }}</span>
      </a>
    </div>
    <button class="strip-btn prev" :class="{ show: more.prev }" type="button" aria-label="Previous screenshots" @click="step(-1)">
      <Icon name="chevron-left" :size="18" />
    </button>
    <button class="strip-btn next" :class="{ show: more.next }" type="button" aria-label="Next screenshots" @click="step(1)">
      <Icon name="chevron-right" :size="18" />
    </button>
  </div>
</template>
