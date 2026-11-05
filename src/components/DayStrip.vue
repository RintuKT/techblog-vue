<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { minMonth, minWeek, newestDay, yearsTo, useToday, addDays, shiftMonth, weekOf, lastIn, weekCells, monthCells, longDate } from '../lib/activity.js'
import Icon from './Icon.vue'

// The phone calendar: one real week that heads the feed (the month opens in place from its name). Picking a day
// asks the page to show only that day (?day); the page owns the address, this owns what is in view.
const props = defineProps({
  days: { type: Map, required: true }, // what the list below can show, by day
  day: { type: String, default: '' }, // the picked day, already checked by the page
})
const emit = defineEmits(['pick'])

// Every visit starts folded on the week of the picked day (or the newest one), so the build and the browser render
// the same and a month left open on another list never shows up here.
const now = useToday()
const open = ref(false)
const month = ref('')
const start = ref(weekOf(props.day || lastIn(props.days)))
const dir = ref('next')
const root = ref(null)
const toggleBtn = ref(null)

const end = computed(() => addDays(start.value, 6))
const inWeek = (k) => k >= start.value && k <= end.value
const maxMonth = computed(() => newestDay(now.value).slice(0, 7))
const maxWeek = computed(() => weekOf(newestDay(now.value)))
const years = computed(() => yearsTo(maxMonth.value))
const year = computed(() => month.value.slice(0, 4))

const cells = computed(() => (open.value ? monthCells(month.value, props.days) : weekCells(start.value, props.days)))
const short = (k) => longDate(k, { month: 'short' })
const title = computed(() => {
  if (open.value) return { m: longDate(`${month.value}-01`, { month: 'long' }), y: year.value }
  const a = start.value, b = end.value
  if (a.slice(0, 7) === b.slice(0, 7)) return { m: longDate(a, { month: 'long' }), y: a.slice(0, 4) }
  if (a.slice(0, 4) === b.slice(0, 4)) return { m: `${short(a)} – ${short(b)}`, y: a.slice(0, 4) }
  return { m: `${short(a)} ${a.slice(0, 4)} – ${short(b)} ${b.slice(0, 4)}`, y: '' }
})
const canPrev = computed(() => (open.value ? month.value > minMonth : start.value > minWeek))
const canNext = computed(() => (open.value ? month.value < maxMonth.value : start.value < maxWeek.value))

// The arrows stay focusable at the ends of the range (aria-disabled), so a keyboard step never drops focus.
function step(n) {
  if (!(n > 0 ? canNext.value : canPrev.value)) return
  dir.value = n > 0 ? 'next' : 'prev'
  if (open.value) month.value = shiftMonth(month.value, n)
  else start.value = addDays(start.value, 7 * n)
}
let foldedHeight = 0
function toggle() {
  dir.value = 'open'
  if (open.value) {
    // Fold to the week you were on; after changing months, to that month's latest active week (else its first).
    if (start.value.slice(0, 7) !== month.value && end.value.slice(0, 7) !== month.value) {
      const last = [...props.days.keys()].filter((k) => k.startsWith(month.value)).sort().pop()
      start.value = weekOf(last || `${month.value}-01`)
    }
    open.value = false
  } else {
    const latest = weekCells(start.value, props.days).filter((c) => c.items.length).pop()?.key
    const m = (props.day && inWeek(props.day) ? props.day : latest || addDays(start.value, 3)).slice(0, 7)
    month.value = [minMonth, m, maxMonth.value].sort()[1]
    foldedHeight = root.value?.offsetHeight || 0
    open.value = true
  }
}
function pickYear(y) {
  if (y === year.value) return
  const last = [...props.days.keys()].filter((k) => k.startsWith(y)).sort().pop()
  dir.value = y > year.value ? 'next' : 'prev'
  month.value = last ? last.slice(0, 7) : y === maxMonth.value.slice(0, 4) ? maxMonth.value : `${y}-12`
}
function pick(key, e) {
  // In the open month a pick folds back onto that day's week, so its stories sit right under it.
  if (open.value) {
    dir.value = 'open'
    start.value = weekOf(key)
    open.value = false
    // The month grid is replaced, so a keyboard pick keeps focus on the month name rather than losing it.
    if (e.detail === 0) nextTick(() => toggleBtn.value?.focus())
  }
  emit('pick', key === props.day ? '' : key)
}
function clear() {
  // The caption with this button goes away, so focus first moves to the day it clears (or the month name).
  ;(root.value?.querySelector('.cal-day.on') || toggleBtn.value)?.focus()
  emit('pick', '')
}

// Back and Forward (or a writer, category or topic link) can bring a day or a list from another week.
function show(key) {
  start.value = weekOf(key)
  if (open.value) month.value = key.slice(0, 7)
}
watch(() => props.day, (d) => { if (d && !(open.value ? d.startsWith(month.value) : inWeek(d))) show(d) })
watch(() => props.days, (m) => { if (!props.day) show(lastIn(m)) })

// An open month adds height above the stories, which matters wherever a saved scroll position comes back:
// - Leaving the page: the month folds first, so the position saved for Back is the folded one.
// - The page being hidden (the router saves the position then, in case the browser reloads the tab): the open
//   month's extra height is saved beside it, and router.js takes it off, since a reload always starts folded.
function setExtra(px) {
  const { dsExtra, ...state } = history.state || {}
  if ((dsExtra || 0) !== px) history.replaceState(px ? { ...state, dsExtra: px } : state, '')
}
function onHide() {
  if (document.visibilityState === 'hidden' && history.state) setExtra(open.value ? Math.max(0, root.value.offsetHeight - foldedHeight) : 0)
}
// Added after the router's own listeners, so this runs right after it saves the position.
onMounted(() => {
  addEventListener('pagehide', onHide)
  document.addEventListener('visibilitychange', onHide)
})
onBeforeUnmount(() => {
  removeEventListener('pagehide', onHide)
  document.removeEventListener('visibilitychange', onHide)
})
onBeforeRouteLeave(async (to, from) => {
  if (!open.value || to.path === from.path) return
  const y = scrollY
  const before = root.value.offsetHeight
  open.value = false
  await nextTick()
  setExtra(0)
  // Keep the same story under the reader: browsers with scroll anchoring have already done it, the rest get a nudge.
  const extra = before - root.value.offsetHeight
  if (scrollY === y && extra > 0 && y > root.value.offsetTop) scrollTo(scrollX, y - extra)
})
</script>

<template>
  <section ref="root" class="dstrip" aria-label="Calendar">
    <header class="cal-head">
      <button ref="toggleBtn" class="ds-title" type="button" :aria-expanded="open" @click="toggle">
        <span>{{ title.m }}</span> <span v-if="title.y" class="ds-y">{{ title.y }}</span><Icon name="chevron-down" :size="16" />
      </button>
      <div class="cal-nav">
        <button class="icon-btn" type="button" :aria-disabled="!canPrev" :aria-label="open ? 'Previous month' : 'Previous week'" @click="step(-1)"><Icon name="chevron-left" :size="18" /></button>
        <button class="icon-btn" type="button" :aria-disabled="!canNext" :aria-label="open ? 'Next month' : 'Next week'" @click="step(1)"><Icon name="chevron-right" :size="18" /></button>
      </div>
    </header>
    <div v-if="open && years.length > 1" class="cal-years" role="group" aria-label="Year">
      <button v-for="y in years" :key="y" type="button" class="cal-year" :class="{ on: y === year }" :aria-pressed="y === year" @click="pickYear(y)">{{ y }}</button>
    </div>

    <div class="cal-week" aria-hidden="true"><span v-for="(w, i) in ['S', 'M', 'T', 'W', 'T', 'F', 'S']" :key="i">{{ w }}</span></div>
    <Transition :name="`cal-${dir}`">
      <div :key="open ? month : start" class="cal-grid">
        <template v-for="c in cells" :key="c.key">
          <span v-if="!c.day" class="cal-day"></span>
          <button
            v-else-if="c.items.length"
            class="cal-day active"
            :class="{ on: c.key === day, today: c.key === now }"
            :aria-pressed="c.key === day"
            :aria-label="c.label"
            :title="c.label"
            @click="pick(c.key, $event)"
          >
            <Icon :name="c.icon" :size="15" />
            <span class="cal-sub">{{ c.sub }}</span>
          </button>
          <span v-else class="cal-day" :class="{ today: c.key === now }">{{ c.day }}</span>
        </template>
      </div>
    </Transition>

    <div v-if="day" class="ds-pick">
      <span>{{ longDate(day, { weekday: 'long', month: 'short', day: 'numeric' }) }}</span>
      <button class="clear" type="button" aria-label="Clear day" @click="clear"><Icon name="close" :size="14" />Clear</button>
    </div>
  </section>
</template>
