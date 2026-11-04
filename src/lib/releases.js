import yaml from 'js-yaml'
import { md, splitFrontMatter, slugFromPath, toDateString, authors } from './content.js'

const rawReleases = import.meta.glob('/content/releases/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})
import productsRaw from '/content/products.yaml?raw'

export const products = yaml.load(productsRaw) || {}
export const productList = Object.entries(products).map(([key, p]) => ({ key, ...p }))

export const releaseTypes = {
  release: 'Release',
  major: 'Major change',
  hotfix: 'Hotfix',
  beta: 'Beta',
}

function normaliseImages(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => (typeof v === 'string' ? { url: v, caption: '' } : { url: String(v?.url || ''), caption: String(v?.caption || '') }))
    .filter((i) => i.url)
}

export const releases = Object.entries(rawReleases)
  .map(([path, text]) => {
    const { meta, body } = splitFrontMatter(text)
    const productKey = String(meta.product || '')
    const product = products[productKey] || { name: productKey || 'Unknown', short: productKey, kind: '' }
    const authorKey = meta.author || ''
    return {
      slug: meta.slug || slugFromPath(path),
      file: path.replace(/^\//, ''),
      productKey,
      product,
      version: meta.version != null ? String(meta.version) : '',
      date: toDateString(meta.date),
      title: meta.title || slugFromPath(path),
      type: releaseTypes[meta.type] ? meta.type : 'release',
      typeLabel: releaseTypes[meta.type] || releaseTypes.release,
      summary: meta.summary || '',
      images: normaliseImages(meta.images),
      links: Array.isArray(meta.links) ? meta.links.filter((l) => l && l.url).map((l) => ({ label: l.label || l.url, url: l.url })) : [],
      authorKey,
      author: authorKey ? authors[authorKey] || { name: authorKey } : null,
      draft: meta.draft === true,
      hasBody: body.trim().length > 0,
      html: md.render(body),
    }
  })
  .filter((r) => !r.draft || import.meta.env.DEV)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

export function findRelease(slug) {
  return releases.find((r) => r.slug === slug)
}

export const productCounts = productList.map((p) => ({ ...p, count: releases.filter((r) => r.productKey === p.key).length }))

export function latestPerProduct() {
  return productList
    .map((p) => releases.find((r) => r.productKey === p.key))
    .filter(Boolean)
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
