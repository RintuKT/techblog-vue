<script setup>
import { computed, ref, watch } from 'vue'
import { byDay, activeDays, lastDay, minMonth, newestDay, yearsTo, useToday, pad, parse, longDate, monthCells } from '../lib/activity.js'
import Icon from './Icon.vue'

// The laptop and tablet calendar (the rail). The days come from lib/activity.js, shared with the phone strip.
// When the page shows one day (?day, from a phone link), the rail opens on it and its days change that day.
const props = defineProps({ day: { type: String, default: '' } })
const emit = defineEmits(['pick'])
const now = useToday()
const maxMonth = computed(() => newestDay(now.value).slice(0, 7))
const years = computed(() => yearsTo(maxMonth.value))
const month = ref((props.day || lastDay).slice(0, 7))
const selected = ref(props.day || (activeDays.length ? lastDay : ''))
const dir = ref('next')
const year = computed(() => month.value.slice(0, 4))
watch(() => props.day, (d) => {
  if (!d) return
  go(d.slice(0, 7))
  selected.value = d
})
function choose(key) {
  selected.value = key
  if (props.day) emit('pick', key)
}

function go(next) {
  if (next === month.value || next < minMonth || next > maxMonth.value) return
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
  go(last ? last.slice(0, 7) : y === maxMonth.value.slice(0, 4) ? maxMonth.value : `${y}-12`)
}

const monthName = computed(() => longDate(`${month.value}-01`, { month: 'long' }))
const cells = computed(() => monthCells(month.value))
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
            :class="{ on: c.key === selected, today: c.key === now }"
            :aria-pressed="c.key === selected"
            :aria-label="c.label"
            :title="c.label"
            @click="choose(c.key)"
          >
            <Icon :name="c.icon" :size="15" />
            <span class="cal-sub">{{ c.sub }}</span>
          </button>
          <span v-else class="cal-day" :class="{ today: c.key === now }">{{ c.day }}</span>
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
