// Fenced code blocks: colour by Shiki at build time, with a header bar for the file name and language.
//   ```python cities.py      -> header "cities.py" + "Python", coloured as Python
//   ```ts                    -> header "TypeScript"
//   ```text                  -> plain, no header
// Both themes are written into the HTML as CSS variables; style.css picks one from data-theme.
import { createHighlighter } from 'shiki'
import vcl from './vcl.mjs'

const THEMES = { dark: 'one-dark-pro', light: 'github-light' }
const LANGS = {
  python: 'Python', py: 'Python',
  ts: 'TypeScript', typescript: 'TypeScript', js: 'JavaScript', javascript: 'JavaScript', vue: 'Vue',
  nginx: 'Nginx', vcl: 'Varnish VCL', json: 'JSON', sql: 'SQL', bash: 'Shell', sh: 'Shell', shell: 'Shell',
  yaml: 'YAML', yml: 'YAML', http: 'HTTP', html: 'HTML', css: 'CSS', dockerfile: 'Dockerfile', kotlin: 'Kotlin',
  swift: 'Swift', dart: 'Dart', go: 'Go',
}

let ready
let highlighter
// Loaded once per build (and once per dev server), before the first page is rendered.
export async function loadHighlighter() {
  ready ??= createHighlighter({
    themes: Object.values(THEMES),
    langs: ['python', 'typescript', 'javascript', 'vue', 'nginx', 'json', 'sql', 'bash', 'yaml', 'http', 'html', 'css',
      'dockerfile', 'kotlin', 'swift', 'dart', 'go', vcl],
  }).then((h) => (highlighter = h))
  return ready
}

const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export function renderCode(content, info) {
  const [lang = '', ...rest] = info.trim().split(/\s+/)
  const id = lang.toLowerCase()
  const title = rest.join(' ')
  const label = LANGS[id] || ''
  const code = content.replace(/\n$/, '')
  let pre
  if (highlighter && label && highlighter.getLoadedLanguages().includes(id)) {
    pre = highlighter.codeToHtml(code, { lang: id, themes: THEMES, defaultColor: false })
  } else {
    pre = `<pre class="shiki"><code>${escape(code)}</code></pre>`
  }
  const head = title || label
    ? `<figcaption class="code-head">${title ? `<span class="code-file">${escape(title)}</span>` : ''}` +
      `${label ? `<span class="code-lang">${label}</span>` : ''}</figcaption>`
    : ''
  return `<figure class="code${head ? '' : ' code-plain'}">${head}${pre}</figure>\n`
}
