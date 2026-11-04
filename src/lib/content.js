import yaml from 'js-yaml'
import MarkdownIt from 'markdown-it'

// All markdown files under content/posts are bundled at build time.
const rawPosts = import.meta.glob('/content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})
import authorsRaw from '/content/authors.yaml?raw'
import categoriesRaw from '/content/categories.yaml?raw'

export const authors = yaml.load(authorsRaw) || {}
export const categories = yaml.load(categoriesRaw) || {}

export const md = new MarkdownIt({ html: false, linkify: true, typographer: true })

export function splitFrontMatter(text) {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(text)
  if (!match) return { meta: {}, body: text }
  return { meta: yaml.load(match[1]) || {}, body: match[2] }
}

export function slugFromPath(path) {
  return path.split('/').pop().replace(/\.md$/, '')
}

export function toDateString(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value || '')
}

function readingMinutes(body) {
  const words = body.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

export function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export const posts = Object.entries(rawPosts)
  .map(([path, text]) => {
    const { meta, body } = splitFrontMatter(text)
    const authorKey = meta.author || ''
    const author = authors[authorKey] || { name: authorKey || 'Unknown', role: '' }
    return {
      slug: meta.slug || slugFromPath(path),
      file: path.replace(/^\//, ''),
      title: meta.title || slugFromPath(path),
      date: toDateString(meta.date),
      authorKey,
      author,
      category: meta.category || '',
      categoryLabel: categories[meta.category] || meta.category || '',
      tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
      summary: meta.summary || '',
      cover: meta.cover ? String(meta.cover) : '',
      featured: meta.featured === true,
      draft: meta.draft === true,
      minutes: readingMinutes(body),
      html: md.render(body),
    }
  })
  .filter((p) => !p.draft || import.meta.env.DEV)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

export function findPost(slug) {
  return posts.find((p) => p.slug === slug)
}

export function formatDate(iso, withYear = true) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

export function relatedPosts(post, limit = 3) {
  const score = (p) =>
    (p.authorKey === post.authorKey ? 2 : 0) +
    (p.category === post.category ? 2 : 0) +
    p.tags.filter((t) => post.tags.includes(t)).length
  return posts
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p)
}

export const allTags = [...new Set(posts.flatMap((p) => p.tags))].sort()
export const tagCounts = allTags.map((t) => ({ tag: t, count: posts.filter((p) => p.tags.includes(t)).length }))
export const usedAuthors = Object.entries(authors)
  .filter(([key]) => posts.some((p) => p.authorKey === key))
  .map(([key, a]) => ({ key, ...a, count: posts.filter((p) => p.authorKey === key).length }))
export const usedCategories = Object.entries(categories)
  .filter(([key]) => posts.some((p) => p.category === key))
  .map(([key, label]) => ({ key, label, count: posts.filter((p) => p.category === key).length }))
export const featuredPosts = (posts.filter((p) => p.featured).length ? posts.filter((p) => p.featured) : posts).slice(0, 4)
