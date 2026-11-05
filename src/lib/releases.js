import { slugFromPath, authors } from './content.js'

// Parsed at build time, like the posts (scripts/vite-content.mjs): front matter is bundled, each body is
// its own chunk fetched when the release is opened.
const rawReleases = import.meta.glob('/content/releases/*.md', { query: '?meta', import: 'default', eager: true })
const bodies = import.meta.glob('/content/releases/*.md', { query: '?html', import: 'default' })
import productsData from '/content/products.yaml?content'

export const products = productsData
export const productList = Object.entries(products).map(([key, p]) => ({ key, ...p }))

export const releaseTypes = {
  release: 'Release',
  major: 'Major change',
  hotfix: 'Hotfix',
  beta: 'Beta',
}

/** Brand icon for a release link, picked from its host; other links get the generic external arrow. */
function linkIcon(url) {
  let host = ''
  try { host = new URL(url).hostname } catch {}
  if (/(^|\.)apple\.com$/.test(host)) return 'apple'
  if (host === 'play.google.com') return 'play-store'
  if (/(^|\.)github\.com$/.test(host)) return 'github'
  return ''
}

function normaliseImages(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => (typeof v === 'string' ? { url: v, caption: '' } : { url: String(v?.url || ''), caption: String(v?.caption || '') }))
    .filter((i) => i.url)
}

export const releases = Object.entries(rawReleases)
  .map(([path, { meta, words }]) => {
    const productKey = String(meta.product || '')
    const product = products[productKey] || { name: productKey || 'Unknown', short: productKey, kind: '' }
    const authorKey = meta.author || ''
    return {
      slug: meta.slug || slugFromPath(path),
      file: path.replace(/^\//, ''),
      productKey,
      product,
      version: meta.version != null ? String(meta.version) : '',
      date: String(meta.date || ''),
      title: meta.title || slugFromPath(path),
      type: releaseTypes[meta.type] ? meta.type : 'release',
      typeLabel: releaseTypes[meta.type] || releaseTypes.release,
      summary: meta.summary || '',
      images: normaliseImages(meta.images),
      links: Array.isArray(meta.links) ? meta.links.filter((l) => l && l.url).map((l) => ({ label: l.label || l.url, url: l.url, icon: linkIcon(l.url) })) : [],
      authorKey,
      author: authorKey ? authors[authorKey] || { name: authorKey } : null,
      draft: meta.draft === true,
      hasBody: words > 0,
      loadHtml: bodies[path],
    }
  })
  .filter((r) => !r.draft || import.meta.env.DEV)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

export function findRelease(slug) {
  return releases.find((r) => r.slug === slug)
}

export const productCounts = productList.map((p) => ({ ...p, count: releases.filter((r) => r.productKey === p.key).length }))

/** The newest release of each product, newest first. */
export function latestPerProduct() {
  const seen = new Set()
  return releases.filter((r) => !seen.has(r.productKey) && seen.add(r.productKey))
}

/** Group a release list by month, newest first. */
export function groupByMonth(list) {
  const groups = []
  for (const r of list) {
    const key = r.date.slice(0, 7)
    let g = groups[groups.length - 1]
    if (!g || g.key !== key) {
      g = { key, label: new Date(key + '-01T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), items: [] }
      groups.push(g)
    }
    g.items.push(r)
  }
  return groups
}
