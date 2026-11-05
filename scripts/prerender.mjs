// Runs after the client and server builds (npm run build). Writes every page as finished HTML, so search engines
// and AI agents read the full text without running JavaScript, plus the files crawlers look for:
// sitemap.xml, robots.txt, feed.xml (RSS), llms.txt and llms-full.txt (plain-text guides for AI agents).
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssrDir = join(root, 'dist-ssr')
const { render, pages, SITE, posts, releases } = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href)

const template = await readFile(join(dist, 'index.html'), 'utf8')
const page = ({ html, head }) =>
  template
    .replace(/<title>[^<]*<\/title>\s*<!--app-head-->/, head)
    .replace('<div id="app"></div>', `<div id="app">${html}</div>`)

async function write(file, text) {
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, text)
}

for (const path of pages) await write(join(dist, path, 'index.html'), page(await render(path)))
await write(join(dist, '404.html'), page(await render('/404')))

const url = (path) => SITE.url + (path === '/' ? '/' : path)
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const newest = [...posts, ...releases].map((x) => x.date).sort().pop()
const lastmod = (path) =>
  path.startsWith('/post/') ? posts.find((p) => `/post/${p.slug}` === path).date
  : path.startsWith('/releases/') ? releases.find((r) => `/releases/${r.slug}` === path).date
  : path === '/releases' ? releases[0]?.date : newest

await write(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${url(p)}</loc><lastmod>${lastmod(p)}</lastmod></url>`).join('\n')}
</urlset>
`)

// Everyone may read the blog, search engines and AI assistants included (named so the intent is explicit).
const aiAgents = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot']
await write(join(dist, 'robots.txt'), `User-agent: *
Allow: /

${aiAgents.map((a) => `User-agent: ${a}\nAllow: /`).join('\n\n')}

Sitemap: ${url('/sitemap.xml')}
`)

await write(join(dist, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE.name}</title>
    <link>${url('/')}</link>
    <description>${xml(SITE.description)}</description>
    <language>en</language>
    <atom:link href="${url('/feed.xml')}" rel="self" type="application/rss+xml" />
${posts.map((p) => `    <item>
      <title>${xml(p.title)}</title>
      <link>${url(`/post/${p.slug}`)}</link>
      <guid>${url(`/post/${p.slug}`)}</guid>
      <pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${xml(p.summary)}</description>
    </item>`).join('\n')}
  </channel>
</rss>
`)

// llms.txt (llmstxt.org): what the site is and where everything is; llms-full.txt has every post and release in full.
const body = async (file) => (await readFile(join(root, file), 'utf8')).replace(/^---\n[\s\S]*?\n---\n?/, '').trim()
await write(join(dist, 'llms.txt'), `# ${SITE.name}

> ${SITE.description} Also known as ${SITE.alternateNames.join(', ')}. Published by ${SITE.org.name} (${SITE.org.url}).

## Stories

${posts.map((p) => `- [${p.title}](${url(`/post/${p.slug}`)}): ${p.summary}`).join('\n')}

## Releases

${releases.map((r) => `- [${r.product.name} ${r.version}: ${r.title}](${url(`/releases/${r.slug}`)}): ${r.summary}`).join('\n')}

## Optional

- [Everything in full text](${url('/llms-full.txt')})
- [RSS feed](${url('/feed.xml')})
- [Eduport](${SITE.org.url})
`)

const full = [`# ${SITE.name}\n\n${SITE.description}`]
for (const p of posts) full.push(`# ${p.title}\n\nURL: ${url(`/post/${p.slug}`)}\nDate: ${p.date}\nAuthor: ${p.author.name}\n\n${p.summary}\n\n${await body(p.file)}`)
for (const r of releases) full.push(`# ${r.product.name} ${r.version}: ${r.title}\n\nURL: ${url(`/releases/${r.slug}`)}\nDate: ${r.date}\n\n${r.summary}\n\n${await body(r.file)}`)
await write(join(dist, 'llms-full.txt'), full.join('\n\n---\n\n') + '\n')

await rm(ssrDir, { recursive: true, force: true })
console.log(`Prerendered ${pages.length} pages for ${SITE.url}, plus 404, sitemap, robots, feed and llms files.`)
