# Eduport Tech Blog

Internal engineering blog. Posts are Markdown files in this repo; the site is a static Vue 3 app built with Vite. No database, no backend, no login layer: host the `dist/` folder somewhere only the organization can reach (VPN, internal S3 bucket, GitHub Pages on a private repo, etc.).

## Run locally

```bash
npm install
npm run dev        # http://localhost:5180
npm run build      # outputs dist/
```

## Write a post

1. Copy `content/_template.md` to `content/posts/YYYY-MM-DD-short-slug.md`. The file name becomes the URL slug.
2. Fill in the front matter:

   | Field | Required | Notes |
   |---|---|---|
   | `title` | yes | Lead with the result; put the number in it when there is one |
   | `date` | yes | `YYYY-MM-DD`; posts are sorted newest first |
   | `author` | yes | A key from `content/authors.yaml` |
   | `category` | yes | A key from `content/categories.yaml` |
   | `tags` | no | Lowercase list, e.g. `[database, latency]` |
   | `summary` | yes | Shown in the list view and under the title |
   | `draft` | no | `true` hides the post from the built site (still visible in `npm run dev`) |

3. Write the body in Markdown. Tables, code blocks, and images placed in `public/` all work.
4. Set `draft: false`, commit, push. Whatever rebuilds and serves `dist/` picks it up.

## Add yourself as an author

Add an entry to `content/authors.yaml`:

```yaml
your-key:
  name: Your Name
  role: Backend Engineer
  email: you@eduport.app
```

The Authors page and the author filter are generated from this file plus the posts that reference each key.

## Categories

Defined in `content/categories.yaml`. Current set: achievement, improvement, release, feature, experiment (what we tried), cost (cost optimization), insight (insights & thoughts). Add or rename there; the filter dropdown follows.

## Layout

```
content/
  authors.yaml       author directory
  categories.yaml    category keys and labels
  _template.md       copy this to start a post
  posts/*.md         the posts
src/
  lib/content.js     reads all posts at build time, parses front matter, renders Markdown
  views/             PostList (filters + list), PostView, AuthorsView
  components/        PostMeta
  style.css          the whole stylesheet; light and dark follow the OS setting
```

## Deploying internally

`npm run build` produces a fully static `dist/`. Routing uses hash URLs (`/#/post/...`), so any static file host works without rewrite rules. A GitHub Action or CI job that runs `npm ci && npm run build` on push to `main` and syncs `dist/` to your internal host is all the automation needed.
