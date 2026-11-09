// Validates front matter in content/posts and content/releases.
// Runs before every build (npm run build) and can be run alone: npm run check
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const root = path.resolve(new URL('..', import.meta.url).pathname)
const load = (f) => yaml.load(fs.readFileSync(path.join(root, 'content', f), 'utf8')) || {}
const authors = load('authors.yaml')
const categories = load('categories.yaml')
const products = load('products.yaml')

let errors = 0
const fail = (file, msg) => { errors++; console.error(`  ✗ ${file}: ${msg}`) }

for (const [key, a] of Object.entries(authors)) {
  if (a?.avatar && !/^(https?:\/\/|\/)/.test(String(a.avatar))) fail('authors.yaml', `avatar for "${key}" must be a remote URL or a path from public/`)
  if (a?.color && !/^#[0-9a-f]{6}$/i.test(String(a.color))) fail('authors.yaml', `color for "${key}" must be a hex colour like '#2f6fed' (in quotes)`)
  if (a?.badge && String(a.badge).length > 6) fail('authors.yaml', `badge for "${key}" must be one short word (6 letters at most)`)
}

function frontMatter(file, text) {
  const m = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(text)
  if (!m) return fail(file, 'missing front matter (--- block)')
  try { return yaml.load(m[1]) || {} } catch (e) { return fail(file, `YAML error: ${e.message.split('\n')[0]} (quote values that contain ": ")`) }
}

function check(dir, rules) {
  const full = path.join(root, 'content', dir)
  const files = fs.readdirSync(full).filter((f) => f.endsWith('.md'))
  for (const f of files) {
    const meta = frontMatter(`${dir}/${f}`, fs.readFileSync(path.join(full, f), 'utf8'))
    if (!meta) continue
    rules(`${dir}/${f}`, meta)
  }
  return files.length
}

const nPosts = check('posts', (f, m) => {
  for (const k of ['title', 'date', 'author', 'category', 'summary']) if (!m[k]) fail(f, `missing ${k}`)
  if (m.author && !authors[m.author]) fail(f, `unknown author "${m.author}" (add to content/authors.yaml)`)
  if (m.category && !categories[m.category]) fail(f, `unknown category "${m.category}"`)
  if (m.cover && !/^(https?:\/\/|\/)/.test(String(m.cover))) fail(f, 'cover must be a remote URL or a path from public/')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(m.date instanceof Date ? m.date.toISOString().slice(0, 10) : m.date))) fail(f, 'date must be YYYY-MM-DD')
})
const nReleases = check('releases', (f, m) => {
  for (const k of ['product', 'version', 'date', 'title', 'summary']) if (!m[k]) fail(f, `missing ${k}`)
  if (m.product && !products[m.product]) fail(f, `unknown product "${m.product}" (add to content/products.yaml)`)
  if (m.author && !authors[m.author]) fail(f, `unknown author "${m.author}"`)
  for (const img of Array.isArray(m.images) ? m.images : []) {
    const url = typeof img === 'string' ? img : img?.url
    if (!/^https?:\/\//.test(String(url))) fail(f, `image must be a remote URL: ${url}`)
  }
})

if (errors) { console.error(`\n${errors} content error(s).`); process.exit(1) }
console.log(`Content OK: ${nPosts} posts, ${nReleases} releases.`)
