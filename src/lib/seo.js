import { findPost, posts } from './content.js'
import { findRelease } from './releases.js'

// What search engines and AI agents learn about each page: title, description, address, share image and
// structured data (schema.org). The build writes it into every page's HTML (scripts/prerender.mjs);
// in the browser, applyHead keeps it current as you move between pages.
// Set VITE_SITE_URL at build time when the blog lives somewhere else.
export const SITE = {
  url: String(import.meta.env.VITE_SITE_URL || 'https://techblog.eduport.in').replace(/\/$/, ''),
  name: 'Eduport Tech Blog',
  alternateNames: ['Eduport Blog', 'Eduport Tech', 'Eduport Engineering Blog', 'Eduport Tech Team Blog'],
  description: 'The Eduport Tech Blog: how the Eduport engineering team builds and runs the Eduport learning apps, with stories, decisions and release notes for every Eduport app.',
  org: { name: 'Eduport', url: 'https://eduport.app' },
}

const abs = (path) => SITE.url + (path === '/' ? '/' : path)
const logo = () => abs('/apple-touch-icon.png')
const publisher = () => ({ '@type': 'Organization', name: SITE.org.name, url: SITE.org.url, logo: { '@type': 'ImageObject', url: logo() } })
const crumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
})

export function pageMeta(route) {
  const path = route.path
  const base = { path, url: abs(path), type: 'website', image: '', index: true }
  if (path === '/') {
    return {
      ...base,
      title: `${SITE.name}: engineering at Eduport`,
      description: SITE.description,
      jsonLd: [
        { '@type': 'WebSite', name: SITE.name, alternateName: SITE.alternateNames, url: abs('/'), description: SITE.description, publisher: publisher(), inLanguage: 'en' },
        {
          '@type': 'Blog', name: SITE.name, url: abs('/'), description: SITE.description, publisher: publisher(),
          blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: abs(`/post/${p.slug}`), datePublished: p.date })),
        },
      ],
    }
  }
  if (path.startsWith('/post/')) {
    const p = findPost(route.params.slug)
    if (p) {
      return {
        ...base,
        title: `${p.title} · ${SITE.name}`,
        description: p.summary || SITE.description,
        type: 'article',
        image: p.cover,
        published: p.date,
        author: p.author.name,
        jsonLd: [
          {
            '@type': 'BlogPosting', headline: p.title, description: p.summary, datePublished: p.date, dateModified: p.date,
            image: p.cover || undefined, url: abs(path), mainEntityOfPage: abs(path), inLanguage: 'en',
            author: { '@type': 'Organization', name: p.author.name, url: abs('/authors') },
            publisher: publisher(), isPartOf: { '@type': 'Blog', name: SITE.name, url: abs('/') },
            articleSection: p.categoryLabel || undefined, keywords: p.tags.join(', ') || undefined,
          },
          crumbs([[SITE.name, '/'], [p.title, path]]),
        ],
      }
    }
  }
  if (path === '/releases') {
    return {
      ...base,
      title: `Releases: what shipped across Eduport apps · ${SITE.name}`,
      description: 'Release notes for every Eduport app (iOS, Android, web and the internal tools), newest first, with versions, dates and screenshots.',
      jsonLd: [crumbs([[SITE.name, '/'], ['Releases', '/releases']])],
    }
  }
  if (path.startsWith('/releases/')) {
    const r = findRelease(route.params.slug)
    if (r) {
      return {
        ...base,
        title: `${r.product.name} ${r.version}: ${r.title} · ${SITE.name}`,
        description: r.summary || `${r.product.name} ${r.version} release notes.`,
        type: 'article',
        image: r.images[0]?.url || '',
        published: r.date,
        jsonLd: [
          {
            '@type': 'TechArticle', headline: `${r.product.name} ${r.version}: ${r.title}`, description: r.summary, datePublished: r.date,
            url: abs(path), mainEntityOfPage: abs(path), image: r.images.map((i) => i.url), publisher: publisher(), inLanguage: 'en',
            about: { '@type': 'SoftwareApplication', name: r.product.name, softwareVersion: r.version, applicationCategory: 'EducationalApplication' },
          },
          crumbs([[SITE.name, '/'], ['Releases', '/releases'], [`${r.product.name} ${r.version}`, path]]),
        ],
      }
    }
  }
  if (path === '/authors') {
    return {
      ...base,
      title: `Writers · ${SITE.name}`,
      description: 'The Eduport teams who write on the Eduport Tech Blog.',
      jsonLd: [crumbs([[SITE.name, '/'], ['Writers', '/authors']])],
    }
  }
  return { ...base, title: `Page not found · ${SITE.name}`, description: SITE.description, index: false, jsonLd: [] }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const ldJson = (items) => JSON.stringify({ '@context': 'https://schema.org', '@graph': items }).replace(/</g, '\\u003c')

/** The <head> tags for a page, as HTML (used by the build). */
export function headTags(m) {
  const image = m.image || logo()
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    m.index ? '<meta name="robots" content="index, follow, max-image-preview:large" />' : '<meta name="robots" content="noindex" />',
    m.index ? `<link rel="canonical" href="${m.url}" />` : '',
    `<meta property="og:site_name" content="${SITE.name}" />`,
    `<meta property="og:type" content="${m.type}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${m.url}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta name="twitter:card" content="${m.image ? 'summary_large_image' : 'summary'}" />`,
    m.published ? `<meta property="article:published_time" content="${m.published}" />` : '',
    m.author ? `<meta property="article:author" content="${esc(m.author)}" />` : '',
    `<link rel="alternate" type="application/rss+xml" title="${SITE.name}" href="${abs('/feed.xml')}" />`,
    m.jsonLd.length ? `<script type="application/ld+json">${ldJson(m.jsonLd)}</script>` : '',
  ].filter(Boolean).join('\n    ')
}

/** Keeps the browser's head in step with the page after in-app navigation. */
export function applyHead(m) {
  document.title = m.title
  const set = (selector, attr, value) => document.head.querySelector(selector)?.setAttribute(attr, value)
  set('meta[name="description"]', 'content', m.description)
  set('link[rel="canonical"]', 'href', m.url)
  set('meta[property="og:title"]', 'content', m.title)
  set('meta[property="og:description"]', 'content', m.description)
  set('meta[property="og:url"]', 'content', m.url)
  const ld = document.head.querySelector('script[type="application/ld+json"]')
  if (ld) ld.textContent = ldJson(m.jsonLd)
}
