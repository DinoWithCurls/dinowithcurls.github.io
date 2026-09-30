// Animation test for the terminal desktop. Drives headless Chrome over the DevTools protocol
// (no extra packages: Node's built-in WebSocket): drags a window onto another and drops it,
// drags a gap to resize, opens and closes a floating window, while the page logs every
// animation frame. Prints what it measured.
//
//   npm run dev                          # in another terminal
//   npm run test:animations              # measure (no screenshots, so nothing stalls frames)
//   npm run test:animations -- shots     # also save screenshots to .animation-test/frames
//
// CHROME=/path/to/chrome and URL=http://... override the defaults.
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = '.animation-test'
const SHOTS = process.argv.includes('shots')
const URL = process.env.URL ?? 'http://localhost:5173/'
const PORT = 9333
mkdirSync(`${OUT}/frames`, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${OUT}/profile`,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

let target
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200)
  try {
    target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page')
  } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))
let id = 0
const pending = new Map()
ws.addEventListener('message', (m) => {
  const msg = JSON.parse(m.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
  }
})
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id
    pending.set(i, r)
    ws.send(JSON.stringify({ id: i, method, params }))
  })
const evaluate = async (expr) =>
  (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.result.value
const mouse = (type, x, y) =>
  send('Input.dispatchMouseEvent', {
    type,
    x,
    y,
    button: 'left',
    buttons: type === 'mouseReleased' ? 0 : 1,
    clickCount: 1,
  })
let shot = 0
const snap = async (label) => {
  if (!SHOTS) return null
  const r = await send('Page.captureScreenshot', { format: 'png' })
  const name = `${String(++shot).padStart(2, '0')}-${label}.png`
  writeFileSync(`${OUT}/frames/${name}`, Buffer.from(r.result.data, 'base64'))
  return name
}

await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: SHOTS ? 0.6 : 1,
  mobile: false,
})
await send('Page.enable')
await send('Page.navigate', { url: URL })
await sleep(6000) // boot: windows pop in and type

// per-frame sampler: each window's section, background and body boxes
await evaluate(`(() => {
  window.__log = []
  const tick = (t) => {
    const f = { t: Math.round(t) }
    for (const w of document.querySelectorAll('[data-win]')) {
      const s = w.getBoundingClientRect(), b = w.querySelector('.tw__bg').getBoundingClientRect(), c = w.querySelector('.tw__body').getBoundingClientRect()
      f[w.dataset.win] = [s.left, s.top, s.width, b.left, b.top, b.width, c.left, c.top, c.width].map(Math.round)
    }
    const fl = document.querySelector('.tf__bg')
    if (fl) { const r = fl.getBoundingClientRect(); f.float = [r.left, r.top, r.width, r.height].map(Math.round) }
    window.__log.push(f)
    if (!window.__stop) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  return true
})()`)
const rect = (sel) =>
  evaluate(
    `(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return [r.left, r.top, r.width, r.height] })()`,
  )

// 1. drag ~/work by its title bar onto TypeDuel and drop
const g = await rect('[data-win="work"] .tw__grab')
const td = await rect('[data-win="project:TypeDuel"]')
const from = [g[0] + 80, g[1] + 12],
  to = [td[0] + td[2] / 2, td[1] + td[3] / 2]
await mouse('mouseMoved', ...from)
await mouse('mousePressed', ...from)
const films = []
for (let i = 1; i <= 30; i++) {
  await mouse('mouseMoved', from[0] + ((to[0] - from[0]) * i) / 30, from[1] + ((to[1] - from[1]) * i) / 30)
  await sleep(16)
  if (i === 15) films.push(await snap('drag-mid'))
}
films.push(await snap('drag-over-target'))
const tDrop = await evaluate('performance.now()')
await mouse('mouseReleased', ...to)
for (let k = 0; k < 6; k++) {
  films.push(await snap(`drop+${k}`))
  await sleep(50)
}
await sleep(700)
films.push(await snap('drop-settled'))

// 2. drag the gap between kitty and fastfetch 220px left, slowly
const h = await rect('[data-win="fastfetch"] .tw__resize')
const hx = h[0] + h[2] / 2,
  hy = h[1] + 120
const tResize = await evaluate('performance.now()')
await mouse('mouseMoved', hx, hy)
await mouse('mousePressed', hx, hy)
for (let i = 1; i <= 22; i++) {
  await mouse('mouseMoved', hx - 10 * i, hy)
  await sleep(16)
  if (i === 11) films.push(await snap('resize-mid'))
}
await mouse('mouseReleased', hx - 220, hy)
await sleep(300)
films.push(await snap('resize-done'))
const tEndResize = await evaluate('performance.now()')

// 3. open Workouter's floating window by clicking the window, then close with Escape
const wo = await rect('[data-win="project:Workouter"]')
const tOpen = await evaluate('performance.now()')
await mouse('mouseMoved', wo[0] + wo[2] / 2, wo[1] + wo[3] - 20)
await mouse('mousePressed', wo[0] + wo[2] / 2, wo[1] + wo[3] - 20)
await mouse('mouseReleased', wo[0] + wo[2] / 2, wo[1] + wo[3] - 20)
await sleep(120)
films.push(await snap('open+120ms'))
await sleep(600)
films.push(await snap('open-done'))
const tClose = await evaluate('performance.now()')
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
await sleep(150)
films.push(await snap('close+150ms'))
await sleep(600)
const tEnd = await evaluate('performance.now()')

const log = await evaluate('(window.__stop = true, window.__log)')
console.log(
  'fit',
  await evaluate(
    '[document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]',
  ),
)
writeFileSync(`${OUT}/log.json`, JSON.stringify({ tDrop, tResize, tEndResize, tOpen, tClose, tEnd, log }))

// analysis ------------------------------------------------------------------------------
const report = []
const fps = log.length / ((log.at(-1).t - log[0].t) / 1000)
report.push(`frames sampled: ${log.length} (~${fps.toFixed(0)} fps)`)
// a) during every phase, does each window's background and body sit exactly on the window?
let worstBg = { d: 0 },
  worstBody = { d: 0 }
for (const f of log)
  for (const [k, v] of Object.entries(f)) {
    if (k === 't') continue
    const dBg = Math.max(Math.abs(v[3] - v[0]), Math.abs(v[4] - v[1]), Math.abs(v[5] - v[2]))
    if (dBg > worstBg.d) worstBg = { d: dBg, win: k, t: f.t }
    const dBody = Math.abs(v[6] - v[0] - 16) // body sits 16px inside the window's left edge
    if (dBody > worstBody.d) worstBody = { d: dBody, win: k, t: f.t }
  }
report.push(`background off its window, worst: ${worstBg.d}px ${worstBg.win ?? ''} at ${worstBg.t ?? '-'}ms`)
report.push(`text off its window, worst: ${worstBody.d}px ${worstBody.win ?? ''}`)
// b) after the drop: does the dragged window travel from the drop point to its slot, smoothly?
const after = log.filter((f) => f.t >= tDrop && f.t <= tDrop + 700)
const path = (w) => after.map((f) => [f.t - Math.round(tDrop), f[w][0], f[w][1]])
const jumps = (p) => Math.max(0, ...p.slice(1).map((q, i) => Math.hypot(q[1] - p[i][1], q[2] - p[i][2])))
for (const w of ['work', 'project:TypeDuel']) {
  const p = path(w)
  report.push(
    `${w} after drop: start (${p[0]?.[1]},${p[0]?.[2]}) → end (${p.at(-1)?.[1]},${p.at(-1)?.[2]}), ${p.length} frames, biggest single-frame move ${jumps(p).toFixed(0)}px`,
  )
}
report.push(`screenshots: ${films.filter(Boolean).join(', ') || 'none (measuring run)'}`)
// c) during the resize: the neighbour's left edge per frame
const rz = log.filter((f) => f.t >= tResize && f.t <= tEndResize)
const edges = rz.map((f) => f['fastfetch'][0])
report.push(
  `resize: fastfetch left edge ${edges[0]} → ${edges.at(-1)} over ${edges.length} frames, biggest step ${Math.max(0, ...edges.slice(1).map((e, i) => Math.abs(e - edges[i])))}px`,
)
let rzBg = 0
for (const f of rz)
  for (const w of ['about', 'fastfetch'])
    rzBg = Math.max(rzBg, Math.abs(f[w][3] - f[w][0]), Math.abs(f[w][5] - f[w][2]))
report.push(`resize: kitty/fastfetch background off its window, worst ${rzBg}px`)
// d) floating window: starts on the tile, grows, shrinks back onto the tile
const fo = log.filter((f) => f.float && f.t >= tOpen && f.t < tClose)
const fc = log.filter((f) => f.float && f.t >= tClose)
const tileAt = (f) => f['project:Workouter'].slice(0, 3)
if (fo.length)
  report.push(
    `float open: first frame ${fo[0].float.join(',')} vs tile ${tileAt(fo[0]).join(',')} → last ${fo.at(-1).float.join(',')} over ${fo.length} frames`,
  )
else report.push('float open: never appeared')
if (fc.length)
  report.push(
    `float close: last frame ${fc.at(-1).float.join(',')} vs tile ${tileAt(fc.at(-1)).join(',')} over ${fc.length} frames; gone after: ${!log.at(-1).float}`,
  )
writeFileSync(`${OUT}/report.txt`, report.join('\n'))
console.log(report.join('\n'))
ws.close()
chrome.kill()
