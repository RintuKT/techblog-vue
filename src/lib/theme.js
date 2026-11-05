import { nextTick, ref, watchEffect } from 'vue'

const KEY = 'techblog.theme'
// Same values as --bg in style.css; kept here so switching never forces a style recalculation.
const BG = { dark: '#121212', light: '#ffffff' }
function initial() {
  try { const v = localStorage.getItem(KEY); if (v === 'light' || v === 'dark') return v } catch {}
  return 'dark'
}
export const theme = ref(initial())
watchEffect(() => {
  document.documentElement.dataset.theme = theme.value
  // Phone browser chrome follows the page background.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BG[theme.value])
  try { localStorage.setItem(KEY, theme.value) } catch {}
})

// The new theme spreads out from the toggle as a circle. While it does, every other transition on the page
// is paused (`theme-switching`), so the new colours land in one step and the circle is the only thing moving.
// Browsers without view transitions cross-fade the colours instead; reduced-motion users get an instant switch.
let switching = 0
export function toggleTheme(event) {
  const next = theme.value === 'dark' ? 'light' : 'dark'
  const root = document.documentElement
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { theme.value = next; return }
  if (!document.startViewTransition) {
    root.classList.add('theme-fade')
    theme.value = next
    setTimeout(() => root.classList.remove('theme-fade'), 300)
    return
  }
  const box = event?.currentTarget?.getBoundingClientRect()
  const x = box ? box.left + box.width / 2 : innerWidth - 40
  const y = box ? box.top + box.height / 2 : 30
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  switching++
  root.classList.add('theme-switching')
  const t = document.startViewTransition(async () => { theme.value = next; await nextTick() })
  // A steady rate: no slow start (which reads as lag) and no long tail (which reads as a stall in the far corner).
  t.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 320, easing: 'linear', pseudoElement: '::view-transition-new(root)' },
    )
  }).catch(() => {})
  t.finished.finally(() => { if (--switching === 0) root.classList.remove('theme-switching') })
}
