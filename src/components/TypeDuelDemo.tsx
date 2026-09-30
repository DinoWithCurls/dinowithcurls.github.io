import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { useInView } from 'framer-motion'
import { useMotion } from '../motion/features'

// TypeDuel in a terminal window, two ways:
// - watch: a demo of a live race (scripted, not a recording). Both players type the same
//   passage over a WebSocket room; you see the room status, a lane per player with live WPM,
//   their carets on the passage, and one typo made and fixed. It loops while on screen.
// - play: race the ghost yourself. Type the passage; the ghost types at a fixed pace; you
//   get your WPM and accuracy at the end. Esc goes back to watching.

// TypeDuel pulls passages from Wikipedia; these are short ones of the same kind.
const PASSAGES = [
  'The Nile is a major north-flowing river in northeastern Africa.',
  'Mount Everest is the highest mountain above sea level on Earth.',
  'The Great Barrier Reef is the largest coral reef system in the world.',
]
const GHOST_WPM = 45
// the demo race: you are a little quicker than the opponent, with one typo at TYPO
const YOU_MS = (i: number) => (i % 9 === 4 ? 190 : i % 4 === 1 ? 120 : 95)
const OPP_MS = (i: number) => (i % 7 === 3 ? 210 : 130)
const TYPO = 17

// fewer than 5 characters in, a rate is just noise
const wpm = (chars: number, ms: number) => (chars >= 5 && ms > 0 ? Math.round(chars / 5 / (ms / 60000)) : 0)
const lane = (done: number, total: number) => (done / total) * 100

type Watch = {
  you: number
  opp: number
  typo: boolean
  t: number
  youAt: number | null
  oppAt: number | null
}
type Play = {
  text: string
  typed: string
  keys: number
  errors: number
  start: number | null
  ghost: number
  ghostAt: number | null
  end: number | null
  /** when this state was last updated: the clock for live WPM */
  t: number
}

export function TypeDuelDemo({ start }: { start: boolean }) {
  const { reduce } = useMotion()
  const ref = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const [mode, setMode] = useState<'watch' | 'play'>('watch')
  const passage = PASSAGES[0]
  const [w, setW] = useState<Watch>({
    you: 0,
    opp: 0,
    typo: false,
    t: 0,
    youAt: null,
    oppAt: null,
  })
  const [p, setP] = useState<Play | null>(null)
  const [round, setRound] = useState(0)

  // watch: run the demo race while it is on screen
  useEffect(() => {
    if (mode !== 'watch' || reduce || !inView || !start) return
    let alive = true
    const timers: number[] = []
    const after = (ms: number, fn: () => void) => timers.push(window.setTimeout(() => alive && fn(), ms))
    const t0 = performance.now() + 600
    after(0, () => setW({ you: 0, opp: 0, typo: false, t: 0, youAt: null, oppAt: null }))
    // you
    let tYou = 600
    for (let i = 1; i <= passage.length; i++) {
      tYou += YOU_MS(i)
      if (i === TYPO) {
        after(tYou, () => setW((s) => ({ ...s, typo: true, t: performance.now() - t0 })))
        tYou += 260
        after(tYou, () => setW((s) => ({ ...s, typo: false })))
        tYou += 110
      }
      const n = i
      const last = i === passage.length
      after(tYou, () =>
        setW((s) => ({
          ...s,
          you: n,
          t: performance.now() - t0,
          youAt: last ? performance.now() - t0 : s.youAt,
        })),
      )
    }
    // opponent
    let tOpp = 600
    for (let i = 1; i <= passage.length; i++) {
      tOpp += OPP_MS(i)
      const n = i
      const last = i === passage.length
      after(tOpp, () =>
        setW((s) => ({
          ...s,
          opp: n,
          t: performance.now() - t0,
          oppAt: last ? performance.now() - t0 : s.oppAt,
        })),
      )
    }
    after(Math.max(tYou, tOpp) + 4200, () => setRound((r) => r + 1))
    return () => {
      alive = false
      timers.forEach(window.clearTimeout)
    }
  }, [mode, reduce, inView, start, passage, round])

  // play: the ghost types at a fixed pace once you start
  const started = p?.start != null && p.end == null
  useEffect(() => {
    if (!started) return
    const id = window.setInterval(
      () => {
        setP((s) => {
          if (!s || s.end != null || s.ghost >= s.text.length) return s
          const ghost = s.ghost + 1
          const now = performance.now()
          return {
            ...s,
            ghost,
            t: now,
            ghostAt: ghost >= s.text.length ? now : s.ghostAt,
          }
        })
      },
      60000 / (GHOST_WPM * 5),
    )
    return () => window.clearInterval(id)
  }, [started])

  useEffect(() => {
    if (mode === 'play') input.current?.focus()
  }, [mode, p?.text])

  const begin = () => {
    const text = PASSAGES[Math.floor(Math.random() * PASSAGES.length)]
    setP({
      text,
      typed: '',
      keys: 0,
      errors: 0,
      start: null,
      ghost: 0,
      ghostAt: null,
      end: null,
      t: 0,
    })
    setMode('play')
  }
  const quit = () => {
    setMode('watch')
    setP(null)
    setRound((r) => r + 1)
  }
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setP((s) => {
      if (!s || s.end != null) return s
      const typed = next.slice(0, s.text.length)
      const added = typed.length > s.typed.length ? typed.slice(s.typed.length) : ''
      let errors = s.errors
      for (let i = 0; i < added.length; i++) if (added[i] !== s.text[s.typed.length + i]) errors++
      const now = performance.now()
      const done = typed.length === s.text.length
      return {
        ...s,
        typed,
        keys: s.keys + added.length,
        errors,
        start: s.start ?? now,
        end: done ? now : null,
        t: now,
      }
    })
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      quit()
    }
  }

  // ---- what to draw ------------------------------------------------------------------------
  const text = mode === 'play' && p ? p.text : passage
  const final = reduce && mode === 'watch'
  const youN = mode === 'play' && p ? p.typed.length : final ? passage.length : w.you
  const oppN = mode === 'play' && p ? p.ghost : final ? passage.length - 7 : w.opp
  const typed = mode === 'play' && p ? p.typed : passage.slice(0, youN)
  const youMs = mode === 'play' && p?.start != null ? (p.end ?? p.t) - p.start : (w.youAt ?? w.t)
  const oppMs = mode === 'play' && p?.start != null ? (p.ghostAt ?? p.t) - p.start : (w.oppAt ?? w.t)
  const youWpm = final ? 96 : wpm(youN, youMs)
  const oppWpm = mode === 'play' ? GHOST_WPM : final ? 81 : wpm(oppN, oppMs)
  const you = lane(youN, text.length)
  const opp = lane(oppN, text.length)

  let result: string | null = null
  if (mode === 'watch' && (final || w.youAt != null)) {
    const by = w.oppAt != null && w.youAt != null ? ` by ${((w.oppAt - w.youAt) / 1000).toFixed(1)}s` : ''
    result = `✓ you won${by} · ${youWpm} wpm · 98% · rematch?`
  }
  if (mode === 'play' && p?.end != null && p.start != null) {
    const acc = p.keys ? Math.round(((p.keys - p.errors) / p.keys) * 100) : 100
    const ghostDone = p.ghostAt != null && p.ghostAt < p.end
    result = ghostDone
      ? `the ghost won · you: ${youWpm} wpm · ${acc}% · again?`
      : `✓ you beat the ghost · ${youWpm} wpm · ${acc}%`
  }

  return (
    <div ref={ref} className="td" data-keep={mode === 'play' ? '' : undefined}>
      <p className="td-status">
        {mode === 'watch' ? (
          <>
            <span className="t-dim">room k7q2 ·</span> <span className="td-live">●</span> 2 connected{' '}
            <span className="t-dim">· demo</span>
          </>
        ) : (
          <>
            you vs ghost{' '}
            <span className="t-dim">
              ({GHOST_WPM} wpm) · {p?.start == null ? 'start typing' : 'go'} · esc quits
            </span>
          </>
        )}
      </p>
      <p className="td-lane">
        <span className="td-who">you</span>
        <span className="td-bar" aria-hidden>
          <span className="td-bar__on td-bar--you" style={{ width: `${you}%` }} />
        </span>
        <span className="td-wpm">{youWpm || '–'} wpm</span>
      </p>
      <p className="td-lane">
        <span className="td-who">{mode === 'play' ? 'ghost' : 'opp'}</span>
        <span className="td-bar" aria-hidden>
          <span className="td-bar__on td-bar--opp" style={{ width: `${opp}%` }} />
        </span>
        <span className="td-wpm">{oppWpm || '–'} wpm</span>
      </p>
      <p className="td-text" onClick={() => mode === 'play' && input.current?.focus()}>
        {text.split('').map((ch, i) => {
          const wrongTypo = mode === 'watch' && w.typo && i === youN
          const got = typed[i]
          const cls = [
            got != null ? (got === ch ? 'is-ok' : 'is-bad') : '',
            wrongTypo ? 'is-bad' : '',
            i === oppN ? 'is-opp' : '',
          ].join(' ')
          return (
            <span key={i} className={cls}>
              {i === youN + (wrongTypo ? 1 : 0) && <span className="td-caret" />}
              {wrongTypo ? 'k' : ch}
            </span>
          )
        })}
      </p>
      <p className="td-foot">
        {result && <span className={result.startsWith('✓') ? 'wd-ok' : 't-dim'}>{result}</span>}
        {mode === 'watch' ? (
          <button className="t-btn td-play" onClick={begin}>
            [ race the ghost ]
          </button>
        ) : (
          <>
            {p?.end != null && (
              <button className="t-btn td-play" onClick={begin}>
                [ again ]
              </button>
            )}
            <button className="t-link td-quit" onClick={quit}>
              back
            </button>
          </>
        )}
      </p>
      {mode === 'play' && (
        <input
          ref={input}
          className="td-input"
          value={p?.typed ?? ''}
          onChange={onChange}
          onKeyDown={onKeyDown}
          aria-label="Type the passage"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      )}
    </div>
  )
}
