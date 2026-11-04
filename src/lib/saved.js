import { ref, watch } from 'vue'

const KEY = 'techblog.saved'
function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
export const saved = ref(load())
watch(saved, (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch {} }, { deep: true })

export function isSaved(slug) { return saved.value.includes(slug) }
export function toggleSaved(slug) {
  saved.value = isSaved(slug) ? saved.value.filter((s) => s !== slug) : [...saved.value, slug]
}
