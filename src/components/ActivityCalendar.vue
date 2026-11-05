<script setup>
import { computed, ref } from 'vue'
import { posts } from '../lib/content.js'
import { releases } from '../lib/releases.js'
import Icon from './Icon.vue'

// Every story and release, keyed by day (YYYY-MM-DD).
const byDay = new Map()
const add = (day, item) => (byDay.get(day) || byDay.set(day, []).get(day)).push(item)
for (const p of posts) add(p.date, { kind: 'story', key: `p:${p.slug}`, to: `/post/${p.slug}`, title: p.title, icon: 'stories' })
for (const r of releases) {
  // Under its icon a release shows its version (4.12.0 reads 4.12); dashboards versioned by date show the day.
  const version = r.version.split(' ')[0]
  const short = /^\d{4}\.\d{2}\.\d{2}$/.test(version) ? '' : version.replace(/^(\d+\.\d+)\.0$/, '$1')
  add(r.date, { kind: 'release', key: `r:${r.slug}`, to: `/releases/${r.slug}`, title: r.title, icon: r.product.icon || 'releases', label: `${r.product.short} ${version}`, short })
}
const activeDays = [...byDay.keys()].sort()

const pad = (n) => String(n).padStart(2, '0')
const now = new Date()
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
const lastDay = activeDays[activeDays.length - 1] || today
const minMonth = (activeDays[0] || today).slice(0, 7)
const maxMonth = [lastDay.slice(0, 7), today.slice(0, 7)].sort()[1]
// The years on top of the calendar, newest first; picking one opens its latest month with something in it.
const years = []
for (let y = +maxMonth.slice(0, 4); y >= +minMonth.slice(0, 4); y--) years.push(String(y))

const month = ref(lastDay.slice(0, 7))
const selected = ref(activeDays.length ? lastDay : '')
const dir = ref('next')
const year = computed(() => month.value.slice(0, 4))

const parse = (key) => key.split('-').map(Number)
const longDate = (key, opts) => new Date(`${key}T00:00:00`).toLocaleDateString('en-US', opts)

function go(next) {
  if (next === month.value || next < minMonth || next > maxMonth) return
  dir.value = next > month.value ? 'next' : 'prev'
  month.value = next
  selected.value = activeDays.filter((k) => k.startsWith(next)).pop() || ''
}
function shift(step) {
  const [y, m] = parse(month.value)
  const d = new Date(y, m - 1 + step, 1)
  go(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`)
}
function pickYear(y) {
  if (y === year.value) return
  const last = activeDays.filter((k) => k.startsWith(y)).pop()
  go(last ? last.slice(0, 7) : y === maxMonth.slice(0, 4) ? maxMonth : `${y}-12`)
}

const monthName = computed(() => longDate(`${month.value}-01`, { month: 'long' }))
const cells = computed(() => {
  const [y, m] = parse(month.value)
  const out = Array.from({ length: new Date(y, m - 1, 1).getDay() }, (_, i) => ({ key: `lead${i}` }))
  for (let d = 1, n = new Date(y, m, 0).getDate(); d <= n; d++) {
    const key = `${month.value}-${pad(d)}`
    const items = byDay.get(key) || []
    const stories = items.filter((i) => i.kind === 'story').length
    const shipped = items.length - stories
    const summary = [stories && `${stories} ${stories === 1 ? 'story' : 'stories'}`, shipped && `${shipped} ${shipped === 1 ? 'release' : 'releases'}`].filter(Boolean).join(', ')
    // An active day shows what happened: the app that shipped with its version, or a story with the date.
    const release = items.find((i) => i.kind === 'release')
    const icon = (release || items[0])?.icon
    out.push({ key, day: d, items, icon, sub: release?.short || String(d), label: `${longDate(key, { month: 'long', day: 'numeric' })}: ${summary}` })
  }
  return out
})
const picked = computed(() => byDay.get(selected.value) || [])
</script>

<template>
  <section class="cal glass">
    <div class="cal-years" role="group" aria-label="Year">
      <button v-for="y in years" :key="y" type="button" class="cal-year" :class="{ on: y === year }" :aria-pressed="y === year" @click="pickYear(y)">{{ y }}</button>
    </div>
    <header class="cal-head">
      <h3>{{ monthName }}</h3>
      <div class="cal-nav">
        <button class="icon-btn" :disabled="month <= minMonth" aria-label="Previous month" @click="shift(-1)"><Icon name="chevron-left" :size="18" /></button>
        <button class="icon-btn" :disabled="month >= maxMonth" aria-label="Next month" @click="shift(1)"><Icon name="chevron-right" :size="18" /></button>
      </div>
    </header>

    <div class="cal-week" aria-hidden="true"><span v-for="(w, i) in ['S', 'M', 'T', 'W', 'T', 'F', 'S']" :key="i">{{ w }}</span></div>
    <Transition :name="`cal-${dir}`">
      <div :key="month" class="cal-grid">
        <template v-for="c in cells" :key="c.key">
          <span v-if="!c.day" class="cal-day"></span>
          <button
            v-else-if="c.items.length"
            class="cal-day active"
            :class="{ on: c.key === selected, today: c.key === today }"
            :aria-pressed="c.key === selected"
            :aria-label="c.label"
            :title="c.label"
            @click="selected = c.key"
          >
            <Icon :name="c.icon" :size="15" />
            <span class="cal-sub">{{ c.sub }}</span>
          </button>
          <span v-else class="cal-day" :class="{ today: c.key === today }">{{ c.day }}</span>
        </template>
      </div>
    </Transition>

    <div v-if="picked.length" class="cal-list">
      <div class="cal-date">{{ longDate(selected, { weekday: 'long', month: 'short', day: 'numeric' }) }}</div>
      <router-link v-for="it in picked" :key="it.key" :to="it.to" class="cal-item">
        <Icon :name="it.icon" :size="16" />
        <span v-if="it.label" class="v">{{ it.label }}</span>
        <span class="t">{{ it.title }}</span>
      </router-link>
    </div>
  </section>
</template>
