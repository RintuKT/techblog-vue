// Parses content at build time so the browser ships no YAML or Markdown parser and renders nothing on load.
//   '/content/posts/x.md?meta'  -> { meta, words }   front matter and word count, for lists (bundled up front)
//   '/content/posts/x.md?html'  -> '<p>…</p>'        the rendered body, its own small chunk fetched on open
//   '/content/x.yaml?content'   -> the parsed object
import yaml from 'js-yaml'
import MarkdownIt from 'markdown-it'
import { loadHighlighter, renderCode } from './markdown/code.mjs'
import { renderFlow } from './markdown/flow.mjs'

const md = new MarkdownIt({ html: false, linkify: true, typographer: true })

// Tables scroll inside their own box on narrow screens; --cols lets the stylesheet give each column room.
md.renderer.rules.table_open = (tokens, idx) => {
  let cols = 0
  for (let i = idx + 1; i < tokens.length && tokens[i].type !== 'tr_close'; i++) if (tokens[i].type === 'th_open') cols++
  return `<div class="table-wrap"><table style="--cols: ${cols}">\n`
}
md.renderer.rules.table_close = () => '</table></div>\n'
// ```flow draws an icon diagram; every other fence is coloured code (see scripts/markdown/).
md.renderer.rules.fence = (tokens, idx, options, env) => {
  const { content, info } = tokens[idx]
  if (info.trim().split(/\s+/)[0] === 'flow') return renderFlow(content, md, env?.file)
  return renderCode(content, info)
}
const image = md.renderer.rules.image
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('loading', 'lazy')
  tokens[idx].attrSet('decoding', 'async')
  return image(tokens, idx, options, env, self)
}

function splitFrontMatter(text, file) {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(text)
  if (!match) return { meta: {}, body: text }
  try {
    return { meta: yaml.load(match[1]) || {}, body: match[2] }
  } catch (err) {
    // A broken front matter should break one post, not the whole site.
    console.error(`Front matter error in ${file}: ${err.message}`)
    return { meta: { title: `Front matter error: ${file.split('/').pop()}`, draft: true }, body: match[2] }
  }
}

const asModule = (data) => ({ code: `export default ${JSON.stringify(data)}`, map: null })

export default function content() {
  return {
    name: 'eduport-content',
    async transform(code, id) {
      const [file, query = ''] = id.split('?')
      const params = new URLSearchParams(query)
      if (/\.ya?ml$/.test(file) && params.has('content')) return asModule(yaml.load(code) || {})
      if (!file.endsWith('.md') || !(params.has('meta') || params.has('html'))) return
      const { meta, body } = splitFrontMatter(code, file)
      if (params.has('html')) {
        await loadHighlighter()
        return asModule(md.render(body, { file }))
      }
      if (meta.date instanceof Date) meta.date = meta.date.toISOString().slice(0, 10)
      return asModule({ meta, words: body.trim().split(/\s+/).filter(Boolean).length })
    },
  }
}
