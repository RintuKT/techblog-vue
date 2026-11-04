import { ref, watchEffect } from 'vue'

const KEY = 'techblog.theme'
function initial() {
  try { const v = localStorage.getItem(KEY); if (v === 'light' || v === 'dark') return v } catch {}
  return 'dark'
}
export const theme = ref(initial())
watchEffect(() => {
  document.documentElement.dataset.theme = theme.value
  try { localStorage.setItem(KEY, theme.value) } catch {}
})
export function toggleTheme() { theme.value = theme.value === 'dark' ? 'light' : 'dark' }
