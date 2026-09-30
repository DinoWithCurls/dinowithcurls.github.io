// The terminal desktop: the site as a tiling window manager (Hyprland-style) full of terminal
// windows. Each window runs a command and prints its output; the ones that open grow into a
// floating window with the full detail. The first window has a real prompt you can type into.
// hjkl / arrows move between windows, Enter opens, / focuses the prompt.
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import '../styles/terminal.css'
import { built, experience, heroLine, profile, projects, toolGroups } from '../content'
import { Tag } from '../components/Tag'
import { WorkouterDemo } from '../components/WorkouterDemo'
import { TypeDuelDemo } from '../components/TypeDuelDemo'
import { useFontsReady } from '../motion/boot'
import { usageFor } from '../skillUsage'
import { Bar } from './Bar'
import { Float } from './Float'
import { Shell } from './Shell'
import { Win } from './Win'
import { L, Cmd } from './print'
import { slug } from './shared'
import {
  TITLES,
  COLS,
  MIN_PX,
  MIN_SPAN,
  DEFAULT_ROWS,
  DEFAULT_SPANS,
  useWide,
  neighbour,
  neighbourIn,
  swapIn,
  slotAt,
  winEl,
  KEYS,
  floatTitle,
} from './tiling'
import { after, desk, printHead, line, BootContext } from './timing'

function ProjectHead({ name }: { name: string }) {
  const p = projects.find((x) => x.name === name)!
  return (
    <motion.div className="t-head" variants={printHead}>
      <L className="t-h">
        {p.name} <span className="t-dim t-date">{p.period}</span>
      </L>
      <L className="t-sub">{p.short}</L>
    </motion.div>
  )
}

export default function TerminalHome() {
  const fontsReady = useFontsReady()
  const [openId, setOpenId] = useState<string | null>(null)
  const [active, setActive] = useState<string | null>('about')
  const [step, setStep] = useState(0)
  // each project demo starts once its window's command has finished typing
  const [demos, setDemos] = useState({ wo: false, td: false })
  const returnFocus = useRef<HTMLElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const kittyRef = useRef<HTMLDivElement>(null)
  const bootRef = useRef<HTMLDivElement>(null)
  // kitty scrolls inside itself (so shell output never resizes the desktop), which means its
  // height comes from the row, not its text. Squeezed narrow, its boot text would be cut off,
  // so give it a minimum height that fits that text plus the prompt line.
  const [kittyMin, setKittyMin] = useState(0)
  useEffect(() => {
    const boot = bootRef.current
    const kitty = kittyRef.current
    if (!boot || !kitty) return
    const measure = () => {
      const cs = getComputedStyle(kitty)
      const promptLine = parseFloat(cs.lineHeight) || 20
      setKittyMin(Math.ceil(boot.offsetHeight + promptLine + 8 + parseFloat(cs.top) + parseFloat(cs.bottom)))
    }
    const ro = new ResizeObserver(measure)
    ro.observe(boot)
    return () => ro.disconnect()
  }, [])
  const deskRef = useRef<HTMLElement>(null)
  const wide = useWide()
  const [rows, setRows] = useState(DEFAULT_ROWS)
  const [spans, setSpans] = useState(DEFAULT_SPANS)
  const [resizing, setResizing] = useState(false)
  // a drag in progress: the layout it started from, and which window is swapped in the preview
  const [drag, setDrag] = useState<{
    from: string[][]
    with: string | null
  } | null>(null)

  const swap = useCallback((a: string, b: string) => {
    setRows((rs) => swapIn(rs, a, b))
  }, [])
  const resetLayout = useCallback(() => {
    setRows(DEFAULT_ROWS)
    setSpans(DEFAULT_SPANS)
  }, [])

  const onDragStart = () => setDrag({ from: rows, with: null })
  const onDragOver = (self: string, x: number, y: number) => {
    if (!drag) return
    const over = slotAt(x, y)
    if (!over || over === self) return
    if (over === drag.with) {
      // back over the window that moved aside: put it back
      setRows(drag.from)
      setDrag({ ...drag, with: null })
    } else {
      setRows(swapIn(drag.from, self, over))
      setDrag({ ...drag, with: over })
    }
  }
  const onDragEnd = (cancelled: boolean) => {
    if (cancelled && drag) setRows(drag.from)
    setDrag(null)
  }

  /** Drag the gap left of window `i` in row `r`: it trades width with its left neighbour. */
  const startResize = (r: number, i: number) => (e: ReactPointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const desk = deskRef.current
    if (!desk) return
    const style = getComputedStyle(desk)
    const inner = desk.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    const colPx = inner / COLS
    // the narrowest a window may get: a share of the row, but at least MIN_PX on screen
    const min = Math.max(MIN_SPAN, Math.ceil(MIN_PX / colPx))
    const base = spans[r]
    const x0 = e.clientX
    setResizing(true)
    const move = (ev: PointerEvent) => {
      const d = Math.round((ev.clientX - x0) / colPx)
      let a = base[i - 1] + d
      let b = base[i] - d
      if (a < min) [a, b] = [min, b - (min - a)]
      if (b < min) [a, b] = [a - (min - b), min]
      setSpans((ss) => ss.map((row, k) => (k !== r ? row : row.map((v, j) => (j === i - 1 ? a : j === i ? b : v)))))
    }
    const up = () => {
      setResizing(false)
      window.removeEventListener('pointermove', move)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up, { once: true })
  }

  /** Where a window sits right now, plus its drag/resize wiring. */
  const tile = (id: string) => {
    const r = rows.findIndex((row) => row.includes(id))
    const i = rows[r].indexOf(id)
    const start = 1 + spans[r].slice(0, i).reduce((a, b) => a + b, 0)
    return {
      place: { row: r, start, span: spans[r][i], first: i === 0 },
      movable: wide,
      instant: resizing,
      onDragStart,
      onDragOver,
      onDragEnd,
      onResize: startResize(r, i),
      onResetRow: () => setSpans((ss) => ss.map((row, k) => (k === r ? DEFAULT_SPANS[r] : row))),
    }
  }

  const open = useCallback((id: string) => {
    returnFocus.current = document.activeElement as HTMLElement | null
    setOpenId(id)
  }, [])
  const close = useCallback(() => {
    setOpenId(null)
    returnFocus.current?.focus?.()
  }, [])

  useEffect(() => {
    if (openId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if ((document.activeElement as HTMLElement | null)?.tagName === 'INPUT') return
      if (e.key === '/') {
        e.preventDefault()
        inputRef.current?.focus()
        return
      }
      const dir = KEYS[e.key]
      if (!dir) return
      e.preventDefault()
      const current = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('[data-win]') ?? null
      if (!wide || !current?.dataset.win) {
        neighbour(current, dir)?.focus()
        return
      }
      const next = neighbourIn(rows, spans, current.dataset.win, dir)
      if (!next) return
      if (e.shiftKey) swap(current.dataset.win, next)
      else winEl(next)?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openId, swap, wide, rows, spans])

  const [workouter, typeduel, rore] = projects
  const win = { active, onActive: setActive }

  return (
    <BootContext.Provider value={fontsReady}>
      <div className="term">
        <Bar title={openId ? floatTitle(openId) : (active && TITLES[active]) || 'aditya@portfolio'} show={fontsReady} />

        <motion.main
          ref={deskRef}
          className="tdesk"
          variants={desk}
          initial="hidden"
          animate={fontsReady ? 'visible' : 'hidden'}
        >
          <Win
            id="about"
            {...tile('about')}
            title={TITLES['about']}
            className="w-kitty"
            {...win}
            onOpen={() => inputRef.current?.focus()}
            minHeight={kittyMin}
            hint="/ type"
          >
            <div className="kitty" ref={kittyRef}>
              <div ref={bootRef}>
                <Cmd cmd="whoami" delay={after(0)} onDone={() => setStep((s) => Math.max(s, 1))}>
                  <L className="t-name">{profile.name}</L>
                  <L className="t-dim">{heroLine}</L>
                </Cmd>
                <Cmd cmd="cat built.md" run={step >= 1} delay={0.35} onDone={() => setStep((s) => Math.max(s, 2))}>
                  {built.map((b) => (
                    <L key={b.key}>
                      <button className="t-built" onClick={() => open(b.open)}>
                        <span className="t-key">{b.key}</span>
                        <span>{b.short}</span>
                        <span className="t-dim">{b.where}</span>
                      </button>
                    </L>
                  ))}
                  <L>
                    <button className="t-link" onClick={() => open('about')}>
                      more: cat about.md ↗
                    </button>
                  </L>
                </Cmd>
              </div>
              <Shell ready={step >= 2} onOpen={open} onReset={resetLayout} inputRef={inputRef} scrollRef={kittyRef} />
            </div>
          </Win>

          <Win id="fastfetch" {...tile('fastfetch')} title={TITLES['fastfetch']} {...win}>
            <Cmd cmd="fastfetch" delay={after(1)}>
              <L className="ff-head">
                <span className="t-accent">aditya</span>@<span className="t-accent">portfolio</span>
              </L>
              <L className="t-dim">────────────────</L>
              {toolGroups.map((g) => (
                <L className="ff-row" key={g.key}>
                  <span className="ff-key">{g.key}</span>
                  <span className="ff-vals">
                    {g.tools.map((t) => (
                      <Tag name={t} key={t} usage={usageFor(t)} />
                    ))}
                  </span>
                </L>
              ))}
              <L className="ff-colors">
                {Array.from({ length: 8 }, (_, i) => (
                  <span key={i} className={`ff-c ff-c${i}`} />
                ))}
              </L>
              <L className="t-dim ff-note"># hover a tool to see where I used it</L>
            </Cmd>
          </Win>

          <Win id="work" {...tile('work')} title={TITLES['work']} {...win}>
            <Cmd cmd="ls ~/work" delay={after(2)}>
              {experience.map((job) => (
                <L key={job.company}>
                  <button
                    className="t-row"
                    data-origin={`role:${job.company}`}
                    onClick={() => open(`role:${job.company}`)}
                  >
                    <span className="t-row__bg" />
                    <span className="t-row__top">
                      <span className="t-dir">{slug(job.company)}/</span>
                      <span className="t-dim t-date">{job.period}</span>
                    </span>
                    <span className="t-row__role">{job.role}</span>
                  </button>
                </L>
              ))}
            </Cmd>
          </Win>

          <Win
            id={`project:${workouter.name}`}
            {...tile(`project:${workouter.name}`)}
            title={TITLES['project:Workouter']}

            {...win}
            onOpen={() => open(`project:${workouter.name}`)}
          >
            <ProjectHead name={workouter.name} />
            {workouter.run && (
              <Cmd
                cmd="workouter plan --week 5 --day 1"
                delay={after(3) + 0.3}
                onDone={() => setDemos((d) => ({ ...d, wo: true }))}
              >
                <L>
                  <WorkouterDemo run={workouter.run} start={demos.wo} />
                </L>
              </Cmd>
            )}
          </Win>

          <Win
            id={`project:${typeduel.name}`}
            {...tile(`project:${typeduel.name}`)}
            title={TITLES['project:TypeDuel']}

            {...win}
            onOpen={() => open(`project:${typeduel.name}`)}
          >
            <ProjectHead name={typeduel.name} />
            <Cmd cmd="typeduel --room k7q2" delay={after(4) + 0.3} onDone={() => setDemos((d) => ({ ...d, td: true }))}>
              <L>
                <TypeDuelDemo start={demos.td} />
              </L>
            </Cmd>
          </Win>

          <Win
            id={`project:${rore.name}`}
            {...tile(`project:${rore.name}`)}
            title={TITLES['project:Rore']}

            {...win}
            onOpen={() => open(`project:${rore.name}`)}
          >
            <ProjectHead name={rore.name} />
            <motion.div className="tags" variants={printHead}>
              {rore.stack.map((s) => (
                <motion.span key={s} variants={line}>
                  <Tag name={s} usage={usageFor(s)} />
                </motion.span>
              ))}
            </motion.div>
          </Win>

          <Win id="contact" {...tile('contact')} title={TITLES['contact']} {...win}>
            <Cmd cmd="cat contact" delay={after(6)}>
              <L>Open to mid-level full-stack roles. Email is fastest.</L>
              <L className="t-contact">
                <a className="t-btn" href={`mailto:${profile.email}`}>
                  [ email me ]
                </a>
                <span className="t-dim">{profile.email}</span>
              </L>
            </Cmd>
          </Win>
        </motion.main>

        <AnimatePresence>{openId && <Float key={openId} id={openId} onClose={close} />}</AnimatePresence>
      </div>
    </BootContext.Provider>
  )
}
