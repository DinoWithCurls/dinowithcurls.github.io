import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { useMotion } from '../motion/features'
import type { AgentRun } from '../content'

// A replay of one real agent run, as it would scroll past in a terminal: the token budget
// fills for each request, a spinner waits on the model, the tool call streams in, the
// validator pushes back, the second attempt is accepted and the planned day prints as a table.
// It loops while on screen; under reduced motion it shows the finished run.

// table lines carry cells, so the plan lays out as a grid that reflows with the window
type Line = { kind: 'call' | 'warn' | 'ok' | 'head' | 'row'; text: string; cells?: string[] }

const SPIN = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
const k = (n: number) => `${(n / 1000).toFixed(1)}k`

function table(run: AgentRun): Line[] {
  return [
    { kind: 'head', text: '', cells: ['push · day 1', 'sets', 'reps', 'kg'] },
    ...run.plan.map(([name, sets, reps, kg]) => ({
      kind: 'row' as const,
      text: '',
      cells: [name, String(sets), reps, String(kg)],
    })),
  ]
}

function finished(run: AgentRun): Line[] {
  const [a, b] = run.turns
  return [
    { kind: 'call', text: `→ submit_day(${a.call}) · ${k(a.total)} tokens` },
    { kind: 'warn', text: `! ${run.warning}` },
    { kind: 'call', text: `→ submit_day(${b.call}) · ${k(b.total)} tokens` },
    { kind: 'ok', text: `✓ accepted in ${run.turns.length} turns · day saved` },
    ...table(run),
  ]
}

const MARKS: Record<Line['kind'], string> = {
  call: 'wd-call',
  warn: 'wd-warn',
  ok: 'wd-ok',
  head: 'wd-head',
  row: 'wd-row',
}

export function WorkouterDemo({ run, start }: { run: AgentRun; start: boolean }) {
  const { reduce } = useMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const [lines, setLines] = useState<Line[]>([])
  const [spin, setSpin] = useState<string | null>(null)
  const [frame, setFrame] = useState(0)
  const [meter, setMeter] = useState<{ used: number; turn: number } | null>(null)

  useEffect(() => {
    if (reduce || !inView || !start) return
    let alive = true
    const sleep = (ms: number) =>
      new Promise<void>((res, rej) => window.setTimeout(() => (alive ? res() : rej(new Error('stop'))), ms))
    const push = (l: Line) => setLines((ls) => [...ls, l])
    const stream = async (text: string, suffix: string) => {
      setLines((ls) => [...ls, { kind: 'call', text: '' }])
      for (let i = 1; i <= text.length; i += 2) {
        await sleep(14)
        setLines((ls) => [...ls.slice(0, -1), { kind: 'call', text: text.slice(0, i) }])
      }
      setLines((ls) => [...ls.slice(0, -1), { kind: 'call', text: text + suffix }])
    }
    const fill = async (turn: number) => {
      const t = run.turns[turn]
      const target = t.prompt + t.reserved
      for (let i = 1; i <= 8; i++) {
        await sleep(40)
        setMeter({ used: Math.round((target * i) / 8), turn })
      }
    }
    const think = async (label: string, ms: number) => {
      setSpin(label)
      await sleep(ms)
      setSpin(null)
    }

    const play = async () => {
      for (;;) {
        setLines([])
        setMeter(null)
        await sleep(500)
        const [a, b] = run.turns
        await fill(0)
        await think(`${run.model} · planning day 1`, 1400)
        await stream(`→ submit_day(${a.call})`, ` · ${k(a.total)} tokens`)
        await sleep(450)
        push({ kind: 'warn', text: `! ${run.warning}` })
        await sleep(1100)
        await fill(1)
        await think(`${run.model} · revising`, 900)
        await stream(`→ submit_day(${b.call})`, ` · ${k(b.total)} tokens`)
        await sleep(400)
        push({
          kind: 'ok',
          text: `✓ accepted in ${run.turns.length} turns · day saved`,
        })
        for (const l of table(run)) {
          await sleep(140)
          push(l)
        }
        await sleep(5200)
      }
    }
    play().catch(() => {})
    return () => {
      alive = false
    }
  }, [reduce, inView, start, run])

  // the spinner only ticks while something is being waited on
  useEffect(() => {
    if (!spin) return
    const id = window.setInterval(() => setFrame((f) => (f + 1) % SPIN.length), 80)
    return () => window.clearInterval(id)
  }, [spin])

  const shownLines = reduce ? finished(run) : lines

  // fill from the top like a terminal; once full, keep the newest line in view
  const screen = useRef<HTMLDivElement>(null)
  // and once lines have scrolled off, fade the top edge so a cut line reads as scrollback
  const [scrolled, setScrolled] = useState(false)
  useLayoutEffect(() => {
    const el = screen.current
    if (!el) return
    el.scrollTop = el.scrollHeight
    const off = el.scrollTop > 0
    if (off !== scrolled) setScrolled(off)
  }, [shownLines, spin, scrolled])
  const m = reduce ? { used: run.turns[1].prompt + run.turns[1].reserved, turn: 1 } : meter

  return (
    <div ref={ref} className="wd">
      <p
        className="wd-meter"
        aria-label={m ? `request ${m.turn + 1}: ${k(m.used)} of ${k(run.budget)} tokens` : undefined}
      >
        <span className="t-dim">budget</span>
        {/* a bar that takes whatever width is left, so the numbers never get cut */}
        <span className="wd-bar" aria-hidden>
          <span className="wd-bar__on" style={{ width: `${m ? (m.used / run.budget) * 100 : 0}%` }} />
        </span>
        {m ? (
          <>
            <span className="wd-num">
              {k(m.used)}/{k(run.budget)}
            </span>
            <span className="t-dim wd-req">req {m.turn + 1}</span>
          </>
        ) : (
          <span className="t-dim">idle</span>
        )}
      </p>
      <div ref={screen} className={`wd-screen${scrolled ? ' is-scrolled' : ''}`}>
        <p className="wd-title"># {run.title}</p>
        {shownLines.map((l, i) =>
          l.cells ? (
            <p key={i} className={`wd-grid ${MARKS[l.kind]}`}>
              {l.cells.map((c, j) => (
                <span key={j}>{c}</span>
              ))}
            </p>
          ) : (
            <p key={i} className={MARKS[l.kind]}>
              {l.text}
            </p>
          ),
        )}
        {spin && (
          <p className="wd-spin">
            {SPIN[frame]} {spin}
          </p>
        )}
      </div>
    </div>
  )
}
