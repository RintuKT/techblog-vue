<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { releases, productCounts, groupByMonth, releaseTypes } from '../lib/releases.js'
import { formatDate } from '../lib/content.js'
import ReleaseCard from '../components/ReleaseCard.vue'

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
</script>

<template>
  <div class="wrap releases">
    <header class="releases-head">
      <h1 class="page-title">Releases</h1>
      <p>Every release and major change across our apps and internal tools, with versions, screenshots and what shipped.</p>
    </header>

    <nav class="tabs" aria-label="Product">
      <button class="tab" :class="{ on: !product }" @click="set({ product: '' })">All <span class="n">{{ releases.length }}</span></button>
      <button v-for="p in productCounts" :key="p.key" class="tab" :class="{ on: product === p.key }" @click="set({ product: p.key })">
        {{ p.short }} <span class="n">{{ p.count }}</span>
      </button>
      <span class="spacer"></span>
      <select :value="type" @change="set({ type: $event.target.value })" aria-label="Type">
        <option value="">All types</option>
        <option v-for="(label, key) in releaseTypes" :key="key" :value="key">{{ label }}</option>
      </select>
    </nav>

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
