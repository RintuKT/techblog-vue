// ```flow blocks: a top-to-bottom diagram of icon cards joined by labelled arrows.
//
//   phone | Phone or browser | **Offline cache** and HTTP cache | ~0 ms     kind | title | detail | metric
//   -> miss                                                                 solid arrow with an optional label
//   cache | Redis | holds the city for an hour
//   ~> commit log                                                           dashed arrow (async, background)
//   caption: One line under the diagram.
//
// Title, detail and caption accept inline Markdown (bold, `code`). Unknown kinds fall back to a generic box.
import {
  UserIcon, SmartPhone01Icon, BrowserIcon, LaptopIcon, Globe02Icon, ServerStack01Icon, Shield01Icon,
  ArrowDataTransferHorizontalIcon, ServerIcon, CpuIcon, Settings02Icon, FlashIcon, DatabaseIcon, CloudServerIcon,
  HardDriveIcon, WifiOffIcon, File01Icon, CodeIcon, Mail01Icon, Clock01Icon,
} from '@hugeicons/core-free-icons'

export const FLOW_KINDS = {
  user:       { icon: UserIcon, tone: 'blue' },
  phone:      { icon: SmartPhone01Icon, tone: 'blue' },
  browser:    { icon: BrowserIcon, tone: 'blue' },
  laptop:     { icon: LaptopIcon, tone: 'blue' },
  edge:       { icon: Globe02Icon, tone: 'cyan' },
  cdn:        { icon: Globe02Icon, tone: 'cyan' },
  region:     { icon: ServerStack01Icon, tone: 'teal' },
  datacenter: { icon: ServerStack01Icon, tone: 'teal' },
  shield:     { icon: Shield01Icon, tone: 'teal' },
  proxy:      { icon: ArrowDataTransferHorizontalIcon, tone: 'violet' },
  app:        { icon: ServerIcon, tone: 'orange' },
  process:    { icon: CpuIcon, tone: 'orange' },
  worker:     { icon: Settings02Icon, tone: 'violet' },
  cache:      { icon: FlashIcon, tone: 'red' },
  db:         { icon: DatabaseIcon, tone: 'green' },
  origin:     { icon: CloudServerIcon, tone: 'amber' },
  storage:    { icon: HardDriveIcon, tone: 'amber' },
  offline:    { icon: WifiOffIcon, tone: 'slate' },
  log:        { icon: File01Icon, tone: 'slate' },
  code:       { icon: CodeIcon, tone: 'violet' },
  queue:      { icon: Mail01Icon, tone: 'amber' },
  timer:      { icon: Clock01Icon, tone: 'slate' },
}
const FALLBACK = { icon: CpuIcon, tone: 'slate' }

const kebab = (k) => k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
function svg(icon) {
  const body = icon
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${kebab(k)}="${v}"`).join(' ')}/>`)
    .join('')
  return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">${body}</svg>`
}

export function renderFlow(source, md, file = '') {
  const items = []
  let caption = ''
  for (const raw of source.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (/^caption:/i.test(line)) { caption = line.replace(/^caption:\s*/i, ''); continue }
    const edge = /^(->|~>)\s*(.*)$/.exec(line)
    if (edge) { items.push({ edge: true, dashed: edge[1] === '~>', label: edge[2] }); continue }
    const [kind = '', title = '', detail = '', metric = ''] = line.split('|').map((s) => s.trim())
    if (!FLOW_KINDS[kind]) console.warn(`flow: unknown kind "${kind}"${file ? ` in ${file}` : ''}`)
    items.push({ kind, title, detail, metric })
  }

  const out = []
  items.forEach((it, i) => {
    if (it.edge) {
      out.push(`<div class="flow-edge${it.dashed ? ' dashed' : ''}">${it.label ? `<span class="flow-label">${md.renderInline(it.label)}</span>` : ''}</div>`)
      return
    }
    // Two cards in a row get a plain arrow between them.
    if (i > 0 && !items[i - 1].edge) out.push('<div class="flow-edge"></div>')
    const k = FLOW_KINDS[it.kind] || FALLBACK
    out.push(
      `<div class="flow-node tone-${k.tone}">` +
        `<span class="flow-icon">${svg(k.icon)}</span>` +
        `<span class="flow-text"><span class="flow-title">${md.renderInline(it.title)}</span>` +
        (it.detail ? `<span class="flow-detail">${md.renderInline(it.detail)}</span>` : '') +
        `</span>` +
        (it.metric ? `<span class="flow-metric">${md.utils.escapeHtml(it.metric)}</span>` : '') +
      `</div>`,
    )
  })
  return `<figure class="flow">${out.join('')}${caption ? `<figcaption>${md.renderInline(caption)}</figcaption>` : ''}</figure>\n`
}
