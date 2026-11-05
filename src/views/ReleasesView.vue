<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { releases, productCounts, groupByMonth, releaseTypes, latestPerProduct } from '../lib/releases.js'
import { formatDate } from '../lib/content.js'
import ReleaseCard from '../components/ReleaseCard.vue'
import FilterSelect from '../components/FilterSelect.vue'
import Icon from '../components/Icon.vue'

const latestReleases = latestPerProduct()

const typeOptions = Object.entries(releaseTypes).map(([value, label]) => ({ value, label }))

const route = useRoute()
const router = useRouter()
const product = computed(() => String(route.query.product || ''))
const type = computed(() => String(route.query.type || ''))

function set(patch) {
  const next = { ...route.query, ...patch }
  for (const k of Object.keys(next)) if (!next[k]) delete next[k]
  router.replace({ path: '/releases', query: next })
}

const filtered = computed(() =>
  releases.filter((r) => (!product.value || r.productKey === product.value) && (!type.value || r.type === type.value)),
)
const groups = computed(() => groupByMonth(filtered.value))
const current = computed(() => productCounts.find((p) => p.key === product.value))
const latest = computed(() => (product.value ? filtered.value[0] : null))

// The highlight sits under the chosen product and glides when the choice changes. It is two round caps and a
// bar stretched between them that only move with transform, so the browser animates it off the main thread
// and its ends stay round all the way. The track fades at whichever edge has more products to scroll to.
const track = ref(null)
const thumb = ref({ x: 0, w: 0, h: 0 })
const animate = ref(false)
const fade = ref({ l: false, r: false })
function place(on) {
  const t = thumb.value
  if (on && (on.offsetLeft !== t.x || on.offsetWidth !== t.w || on.offsetHeight !== t.h)) thumb.value = { x: on.offsetLeft, w: on.offsetWidth, h: on.offsetHeight }
}
function measureFade() {
  const el = track.value
  if (!el) return
  const l = el.scrollLeft > 2
  const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
  if (l !== fade.value.l || r !== fade.value.r) fade.value = { l, r }
}
function measure() {
  place(track.value?.querySelector('.tab.on'))
  measureFade()
}
// A pick moves the highlight at once; the list below follows a frame later, so the glide starts on a light frame.
function pick(key, e) {
  place(e.currentTarget)
  requestAnimationFrame(() => setTimeout(() => set({ product: key })))
}
let observer
onMounted(() => {
  measure()
  requestAnimationFrame(() => { animate.value = true })
  observer = new ResizeObserver(measure)
  observer.observe(track.value)
})
onBeforeUnmount(() => observer?.disconnect())
watch(product, async () => {
  await nextTick()
  measure()
  track.value?.querySelector('.tab.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
})
</script>

<template>
  <div class="wrap releases">
    <header class="releases-head">
      <h1 class="page-title">Releases. <span>What shipped across our apps.</span></h1>
    </header>

    <section class="latest">
      <h3>Latest per app</h3>
      <div class="apps">
        <router-link v-for="r in latestReleases" :key="r.slug" class="app glass" :to="`/releases/${r.slug}`">
          <span class="app-name"><Icon :name="r.product.icon || 'releases'" :size="16" />{{ r.product.short }}</span>
          <span class="app-ver">{{ r.version }}</span>
          <span class="app-date">{{ formatDate(r.date, false) }}</span>
        </router-link>
      </div>
    </section>

    <div class="tabs-bar">
      <div class="track">
        <nav ref="track" class="tabs" :class="{ 'fade-l': fade.l, 'fade-r': fade.r }" aria-label="Product" @scroll.passive="measureFade">
          <span class="tab-thumb" :class="{ animate }" :style="{ '--x': `${thumb.x}px`, '--w': `${thumb.w}px`, '--h': `${thumb.h}px`, '--mid': thumb.w - thumb.h }" aria-hidden="true"><i></i><i></i><i></i></span>
          <button class="tab" :class="{ on: !product }" :aria-pressed="!product" @click="pick('', $event)"><Icon name="grid" :size="16" />All</button>
          <button v-for="p in productCounts" :key="p.key" class="tab" :class="{ on: product === p.key }" :aria-pressed="product === p.key" @click="pick(p.key, $event)">
            <Icon v-if="p.icon" :name="p.icon" :size="16" />{{ p.short }}
          </button>
        </nav>
      </div>
      <FilterSelect :model-value="type" :options="typeOptions" label="Type" all-label="All types" @update:model-value="set({ type: $event })" />
    </div>

    <div v-if="current" class="product-head">
      <div>
        <div class="pname">{{ current.name }}</div>
        <div class="psub">{{ current.kind }} · {{ current.count }} {{ current.count === 1 ? 'release' : 'releases' }}<template v-if="latest"> · latest <b>{{ latest.version }}</b> on {{ formatDate(latest.date) }}</template></div>
      </div>
    </div>

    <section v-for="g in groups" :key="g.key" class="month">
      <div class="month-label">{{ g.label }}</div>
      <div class="month-items">
        <ReleaseCard v-for="r in g.items" :key="r.slug" :release="r" :show-product="!product" />
      </div>
    </section>

    <p v-if="filtered.length === 0" class="empty">No releases yet for this filter.</p>
  </div>
</template>
