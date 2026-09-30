// The tiling: which window sits where, how wide it is, and how to find neighbours and the
// slot under the pointer. Pure data and DOM lookups; the state itself lives in TerminalHome.
import { useSyncExternalStore } from 'react'
import { slug } from './shared'

// The tiling: rows of windows, each with a width in grid columns. Nothing is saved; a reload
// (or `reset` in the shell, or a double-click on a gap) puts everything back.
export const BOOT_ORDER = [
  'about',
  'fastfetch',
  'work',
  'project:Workouter',
  'project:TypeDuel',
  'project:Rore',
  'contact',
]
/** Each window's title: on its border, and in the bar while it has focus. */
export const TITLES: Record<string, string> = {
  about: 'kitty · ~',
  fastfetch: 'fastfetch',
  work: '~/work',
  'project:Workouter': '~/projects/workouter',
  'project:TypeDuel': '~/projects/typeduel',
  'project:Rore': '~/projects/rore',
  contact: '~/contact',
}
export const COLS = 240
export const MIN_SPAN = 60
/** ...and never narrower than this, whatever the screen width */
export const MIN_PX = 340
export const DEFAULT_ROWS = [
  ['about', 'fastfetch'],
  ['work', 'project:Workouter', 'project:TypeDuel'],
  ['project:Rore', 'contact'],
]
export const DEFAULT_SPANS = [
  [140, 100],
  [80, 80, 80],
  [120, 120],
]
export const WIDE = '(min-width: 1001px) and (min-height: 641px)'

/** True where the windows tile side by side (laptop and up); below that they stack. */
export function useWide() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(WIDE)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(WIDE).matches,
  )
}

/** hjkl / arrows move focus to the nearest window in that direction. */
export function neighbour(from: HTMLElement | null, dir: 'l' | 'r' | 'u' | 'd') {
  const wins = [...document.querySelectorAll<HTMLElement>('[data-win]')]
  if (!from) return wins[0]
  const a = from.getBoundingClientRect()
  const ax = a.left + a.width / 2
  const ay = a.top + a.height / 2
  let best: HTMLElement | undefined
  let bestScore = Infinity
  for (const w of wins) {
    if (w === from) continue
    const b = w.getBoundingClientRect()
    const bx = b.left + b.width / 2
    const by = b.top + b.height / 2
    const dx = bx - ax
    const dy = by - ay
    const ok = dir === 'l' ? dx < -4 : dir === 'r' ? dx > 4 : dir === 'u' ? dy < -4 : dy > 4
    if (!ok) continue
    const along = dir === 'l' || dir === 'r' ? Math.abs(dx) : Math.abs(dy)
    const across = dir === 'l' || dir === 'r' ? Math.abs(dy) : Math.abs(dx)
    const score = along + across * 2
    if (score < bestScore) {
      bestScore = score
      best = w
    }
  }
  return best
}

/**
 * The same, read from the tiling itself rather than the screen, so it is right even while
 * windows are still sliding into place after a swap.
 */
export function neighbourIn(rows: string[][], spans: number[][], id: string, dir: 'l' | 'r' | 'u' | 'd') {
  const r = rows.findIndex((row) => row.includes(id))
  if (r < 0) return undefined
  const i = rows[r].indexOf(id)
  if (dir === 'l') return rows[r][i - 1]
  if (dir === 'r') return rows[r][i + 1]
  const other = rows[dir === 'u' ? r - 1 : r + 1]
  if (!other) return undefined
  const otherSpans = spans[dir === 'u' ? r - 1 : r + 1]
  const mid = spans[r].slice(0, i).reduce((a, b) => a + b, 0) + spans[r][i] / 2
  let edge = 0
  for (let j = 0; j < other.length; j++) {
    edge += otherSpans[j]
    if (mid < edge) return other[j]
  }
  return other[other.length - 1]
}

export const swapIn = (rows: string[][], a: string, b: string) =>
  rows.map((r) => r.map((id) => (id === a ? b : id === b ? a : id)))

/**
 * Which window's slot is under a viewport point. Uses layout boxes (offsets), not what is on
 * screen: a window sliding out of the way is still drawn under the pointer for a moment.
 */
export function slotAt(x: number, y: number) {
  for (const el of document.querySelectorAll<HTMLElement>('[data-win]')) {
    const r = el.getBoundingClientRect()
    const own = new DOMMatrixReadOnly(getComputedStyle(el).transform)
    const l = r.left - own.m41
    const t = r.top - own.m42
    if (x >= l && x <= l + r.width && y >= t && y <= t + r.height) return el.dataset.win ?? null
  }
  return null
}

export const winEl = (id: string) => document.querySelector<HTMLElement>(`[data-win="${CSS.escape(id)}"]`)

export const KEYS: Record<string, 'l' | 'r' | 'u' | 'd'> = {
  H: 'l',
  L: 'r',
  K: 'u',
  J: 'd',
  h: 'l',
  ArrowLeft: 'l',
  l: 'r',
  ArrowRight: 'r',
  k: 'u',
  ArrowUp: 'u',
  j: 'd',
  ArrowDown: 'd',
}

/** The floating window's title, as a file path. */
export function floatTitle(id: string) {
  if (id === 'about') return '~/about.md'
  const [kind, name] = id.split(':')
  return kind === 'role' ? `~/work/${slug(name)}.md` : `~/projects/${slug(name)}/README.md`
}
