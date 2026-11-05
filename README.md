# Eduport Tech Blog

The public Eduport engineering blog. Posts are Markdown files in this repo; the site is a static Vue 3 app built with Vite. No database, no backend: every page is pre-rendered to HTML at build time, so search engines and AI agents read it in full.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5180
npm run check      # validates front matter, authors, categories, image URLs
npm run build      # runs the check, builds the app, pre-renders every page into dist/
```

## Write a post

1. Copy `content/_template.md` to `content/posts/YYYY-MM-DD-short-slug.md`. The file name becomes the URL slug. The template shows every supported element; `content/STYLE.md` is the house style.
2. Fill in the front matter:

   | Field | Required | Notes |
   |---|---|---|
   | `title` | yes | Lead with the result; put the number in it when there is one |
   | `date` | yes | `YYYY-MM-DD`; posts are sorted newest first |
   | `author` | yes | A key from `content/authors.yaml` |
   | `category` | yes | A key from `content/categories.yaml` |
   | `tags` | no | Lowercase list, e.g. `[database, latency]` |
   | `summary` | yes | Shown in the list view and under the title |
   | `cover` | no | Remote image URL shown as the cover and the list thumbnail (1200×675 works well) |
   | `featured` | no | `true` pins the post in the sidebar's Featured list |
   | `draft` | no | `true` hides the post from the built site (still visible in `npm run dev`) |

3. Write the body in Markdown. Tables and code blocks work. Images are remote URLs: upload the image to the usual bucket/CDN and reference it with `![caption](https://...)`. Nothing binary goes in this repo.
4. Run `npm run check`. Titles or summaries containing `: ` must be wrapped in quotes.
5. Set `draft: false`, commit, push. Whatever rebuilds and serves `dist/` picks it up.

## Add a release

Releases live in `content/releases/` and show on the Releases page, grouped by month and filterable by product. Copy `content/_release-template.md` to `content/releases/YYYY-MM-DD-<product>-<version>.md` and fill in:

| Field | Required | Notes |
|---|---|---|
| `product` | yes | A key from `content/products.yaml`: web, ios, android, staff, sales, content, studio |
| `version` | yes | App version, build number, or a date tag for dashboards |
| `date` | yes | Release date, `YYYY-MM-DD` |
| `title` | yes | What the release is about |
| `type` | no | `release` (default, shown without a label), `major`, `hotfix`, `beta` |
| `summary` | yes | One or two sentences for the list |
| `images` | no | List of `{url, caption}`; remote URLs only. Phone screenshots and desktop screenshots both work; about 800px tall is plenty (bigger files only cost memory) |
| `links` | no | List of `{label, url}`: store listing, release PR, ticket |
| `author` | no | A key from `content/authors.yaml` |

The body is free Markdown; the template suggests New / Improved / Fixed / Notes. Add a product by adding a key to `content/products.yaml`.

## Add yourself as an author

Add an entry to `content/authors.yaml`:

```yaml
your-key:
  name: Your Name
  role: Backend Engineer
  email: you@eduport.app
  avatar: https://...   # optional, square photo; without it the site draws a mark from your name
```

The Authors page and the author filter are generated from this file plus the posts that reference each key.

## Categories

Defined in `content/categories.yaml`. Current set: achievement, improvement, release, feature, experiment (what we tried), cost (cost optimization), insight (insights & thoughts). Add or rename there; the filter dropdown follows.

## Layout

```
content/
  authors.yaml       author directory
  categories.yaml    category keys and labels
  STYLE.md           house style guide
  _template.md       default post template; copy this to start a post
  _release-template.md
  products.yaml      products that ship releases (tab order on the Releases page)
  posts/*.md         the posts
  releases/*.md      release notes, one file per release
src/
  lib/content.js     reads all posts at build time, parses front matter, renders Markdown
  lib/theme.js       dark/light toggle (localStorage, defaults to dark)
  lib/releases.js    reads content/releases and content/products.yaml
  views/             PostList (home), PostView, ReleasesView, ReleaseView, AuthorsView
  components/        PostCard, ReleaseCard, ScreenStrip, Avatar, FilterSelect, Icon (Hugeicons)
  assets/            eduport-logo.png, the header logo
  style.css          the whole stylesheet; dark by default, light via the header toggle; phones get a bottom tab bar
public/              favicon-32.png and apple-touch-icon.png, served as-is
```

## Deploying

`npm run build` produces a fully static `dist/` with one HTML file per page (`post/<slug>.html`, `releases/<slug>.html`, ...), plus `404.html`. Hosts that serve `name.html` at `/name` work as they are (Cloudflare Pages and Workers, Netlify, Vercel); point unknown paths at `404.html`.

The public address is `https://techblog.eduport.in`. To use another, build with `VITE_SITE_URL=https://blog.example.com npm run build`; canonical links, the sitemap, the feed and the structured data all follow it.

## Search engines and AI agents

The build writes, for every page: a title, description, canonical link, Open Graph and Twitter tags, and schema.org data (`WebSite` and `Blog` on the home page, `BlogPosting` for stories, `TechArticle` for releases, breadcrumbs). It also writes:

| File | For |
|---|---|
| `sitemap.xml` | every page with its date; submit it in Google Search Console and Bing Webmaster Tools |
| `robots.txt` | allows all crawlers, with Google, Bing and the AI crawlers (ChatGPT, Claude, Perplexity, Gemini, Apple) named |
| `feed.xml` | RSS feed of stories |
| `llms.txt`, `llms-full.txt` | a plain-text map of the blog and the full text of every post and release, for AI agents |

Page titles and descriptions come from each post's `title` and `summary`, so a clear summary is the best thing a writer can do for search.
