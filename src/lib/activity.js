import { onMounted, ref } from 'vue'
import { posts } from './content.js'
import { releases } from './releases.js'

// The calendar's data, built once from the content and shared by the laptop rail (ActivityCalendar) and the
// phone strip (DayStrip). Pure: no window, so the build and the browser compute the same cells.

/** A release as the calendar writes it: iOS 4.12.0 (a build number after a space is dropped). */
export const releaseLabel = (r) => `${r.product.short} ${r.version.split(' ')[0]}`

/** Every story and release, keyed by day (YYYY-MM-DD). */
export function dayMap(storyList, releaseList) {
  const map = new Map()
  const add = (day, item) => (map.get(day) || map.set(day, []).get(day)).push(item)
  for (const p of storyList) add(p.date, { kind: 'story', key: `p:${p.slug}`, to: `/post/${p.slug}`, title: p.title, icon: 'stories' })
  for (const r of releaseList) {
    // Under its icon a release shows its version (4.12.0 reads 4.12); dashboards versioned by date show the day.
    const version = r.version.split(' ')[0]
    const short = /^\d{4}\.\d{2}\.\d{2}$/.test(version) ? '' : version.replace(/^(\d+\.\d+)\.0$/, '$1')
    add(r.date, { kind: 'release', key: `r:${r.slug}`, to: `/releases/${r.slug}`, title: r.title, icon: r.product.icon || 'releases', label: releaseLabel(r), short })
  }
  return map
}
export const byDay = dayMap(posts, releases)
export const activeDays = [...byDay.keys()].sort()

export const pad = (n) => String(n).padStart(2, '0')
export const parse = (key) => key.split('-').map(Number)
export const longDate = (key, opts) => new Date(`${key}T00:00:00`).toLocaleDateString('en-US', opts)
export const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// The range comes from the content (the clock only stands in when there is no content at all).
export const lastDay = activeDays[activeDays.length - 1] || keyOf(new Date())
export const minMonth = (activeDays[0] || lastDay).slice(0, 7)

/**
 * Today as a day key, read each time a calendar mounts. It stays empty while the page is built, so the build and the
 * browser's first render are the same; the today ring and a newer reachable month or week follow once the page is live.
 */
export function useToday() {
  const now = ref('')
  onMounted(() => { now.value = keyOf(new Date()) })
  return now
}
/** The newest day a calendar reaches: the newest content, or today once it is later. */
export const newestDay = (now) => [lastDay, now].sort()[1]
/** The years on top of the calendar, newest first, down to the first content. */
export function yearsTo(maxMonth) {
  const out = []
  for (let y = +maxMonth.slice(0, 4); y >= +minMonth.slice(0, 4); y--) out.push(String(y))
  return out
}

/** Calendar arithmetic on day keys (local dates, so no time zone or daylight-saving shifts). */
export function addDays(key, n) {
  const [y, m, d] = parse(key)
  return keyOf(new Date(y, m - 1, d + n))
}
export function shiftMonth(month, n) {
  const [y, m] = parse(month)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}
/** The Sunday that starts the week of a day. */
export function weekOf(key) {
  const [y, m, d] = parse(key)
  return addDays(key, -new Date(y, m - 1, d).getDay())
}
export const lastIn = (map) => [...map.keys()].sort().pop() || lastDay
export const minWeek = weekOf(activeDays[0] || lastDay)

/** One day's cell: what the laptop calendar has always drawn (icon and version or date, and a spoken summary). */
export function dayCell(key, map = byDay) {
  const items = map.get(key) || []
  const stories = items.filter((i) => i.kind === 'story').length
  const shipped = items.length - stories
  const summary = [stories && `${stories} ${stories === 1 ? 'story' : 'stories'}`, shipped && `${shipped} ${shipped === 1 ? 'release' : 'releases'}`].filter(Boolean).join(', ')
  // An active day shows what happened: the app that shipped with its version, or a story with the date.
  const release = items.find((i) => i.kind === 'release')
  const icon = (release || items[0])?.icon
  const day = parse(key)[2]
  return { key, day, items, icon, sub: release?.short || String(day), label: `${longDate(key, { month: 'long', day: 'numeric' })}: ${summary}` }
}
/** A month grid: blanks up to its first weekday, then a cell per day. */
export function monthCells(month, map = byDay) {
  const [y, m] = parse(month)
  const out = Array.from({ length: new Date(y, m - 1, 1).getDay() }, (_, i) => ({ key: `lead${i}` }))
  for (let d = 1, n = new Date(y, m, 0).getDate(); d <= n; d++) out.push(dayCell(`${month}-${pad(d)}`, map))
  return out
}
/** A real Sunday-to-Saturday week, running into the next month where it does. */
export const weekCells = (start, map = byDay) => Array.from({ length: 7 }, (_, i) => dayCell(addDays(start, i), map))
