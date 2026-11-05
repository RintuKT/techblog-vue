// Every content file is parsed at build time (scripts/vite-content.mjs), so nothing is parsed in the browser.
// Lists need only each post's front matter, which is bundled; a post's body is its own small chunk,
// fetched when the post is opened (or when a pointer reaches its card), so pages hold only what they show.
const rawPosts = import.meta.glob('/content/posts/*.md', { query: '?meta', import: 'default', eager: true })
const bodies = import.meta.glob('/content/posts/*.md', { query: '?html', import: 'default' })
import authorsData from '/content/authors.yaml?content'
import categoriesData from '/content/categories.yaml?content'

export const authors = authorsData
export const categories = categoriesData

export function slugFromPath(path) {
  return path.split('/').pop().replace(/\.md$/, '')
}

const readingMinutes = (words) => Math.max(1, Math.round(words / 220))

/** Wraps a body loader so the body is fetched once; .now() gives it without waiting once it is in. */
export function cachedBody(load) {
  let html
  const get = () => (html !== undefined ? Promise.resolve(html) : load().then((h) => (html = h)))
  get.now = () => html
  return get
}

export const posts = Object.entries(rawPosts)
  .map(([path, { meta, words }]) => {
    const authorKey = meta.author || ''
    const author = authors[authorKey] || { name: authorKey || 'Unknown', role: '' }
    return {
      slug: meta.slug || slugFromPath(path),
      file: path.replace(/^\//, ''),
      title: meta.title || slugFromPath(path),
      date: String(meta.date || ''),
      authorKey,
      author,
      category: meta.category || '',
      categoryLabel: categories[meta.category] || meta.category || '',
      tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
      summary: meta.summary || '',
      cover: meta.cover ? String(meta.cover) : '',
      featured: meta.featured === true,
      draft: meta.draft === true,
      minutes: readingMinutes(words),
      loadHtml: cachedBody(bodies[path]),
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
