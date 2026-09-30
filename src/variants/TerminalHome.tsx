// The terminal desktop: the site as a tiling window manager (Hyprland-style) full of terminal
// windows. Each window runs a command and prints its output; the ones that open grow into a
// floating window with the full detail. The first window has a real prompt you can type into.
// hjkl / arrows move between windows, Enter opens, / focuses the prompt.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import '../styles/terminal.css'
import { about, built, education, experience, heroLine, outsideWork, profile, projects, toolGroups } from '../content'
import { DownloadIcon, GithubIcon, LinkedinIcon, MailIcon } from '../components/icons'
import { Tag } from '../components/Tag'
import { AgentLog } from '../components/AgentLog'
import { TypeRace } from '../components/TypeRace'
import { EASE, useFontsReady } from '../motion/boot'
import { useMotion } from '../motion/features'
import { usageFor } from '../skillUsage'

const RADIUS = 10
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

// Boot timing: windows pop in one after another, then each types its command.
const POP_START = 0.35
const POP_STEP = 0.11
const POP_DUR = 0.34
/** When window `i` has finished popping in (seconds after load). */
const after = (i: number) => POP_START + i * POP_STEP + POP_DUR

const desk: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: POP_START, staggerChildren: POP_STEP } },
}
const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: POP_DUR, ease: EASE } },
}
const printOut: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}
const printHead: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: POP_DUR * 0.6, staggerChildren: 0.06 } },
}
const line: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.14 } },
}

/** False until the fonts are in, so typing never starts on fallback metrics. */
const BootContext = createContext(false)

/** One printed line; it fades in with its block's stagger. */
function L({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div className={`t-l${className ? ` ${className}` : ''}`} variants={line}>
      {children}
    </motion.div>
  )
}

function Prompt({ cwd = '~' }: { cwd?: string }) {
  return (
    <span className="t-prompt" aria-hidden>
      <span className="t-cwd">{cwd}</span> <span className="t-arrow">❯</span>{' '}
    </span>
  )
}

/** Types `text` out once `run` is true, after `delay` seconds. Instant under reduced motion. */
function useTyped(text: string, run: boolean, delay: number, reduce: boolean) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (reduce || !run) return
    let i = 0
    let t = 0
    const tick = () => {
      i += 1
      setN(i)
      if (i < text.length) t = window.setTimeout(tick, 28 + ((i * 37) % 5) * 9)
    }
    t = window.setTimeout(tick, delay * 1000)
    return () => window.clearTimeout(t)
  }, [text, run, delay, reduce])
  const shown = reduce ? text.length : n
  return { typed: text.slice(0, shown), done: shown >= text.length }
}

/** A command that types itself, then prints its output (children made of <L> lines). */
function Cmd({
  cmd,
  cwd,
  delay = 0,
  run = true,
  onDone,
  children,
}: {
  cmd: string
  cwd?: string
  delay?: number
  run?: boolean
  onDone?: () => void
  children?: ReactNode
}) {
  const ready = useContext(BootContext)
  const { reduce } = useMotion()
  const { typed, done } = useTyped(cmd, ready && run, delay, reduce)
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
  })
  useEffect(() => {
    if (done) doneRef.current?.()
  }, [done])

  return (
    <>
      <p className="t-l t-cmdline">
        <Prompt cwd={cwd} />
        <span className="t-sr">{cmd}</span>
        <span aria-hidden>{typed}</span>
        {!done && ready && run && <span className="t-cursor" aria-hidden />}
      </p>
      {children && (
        <motion.div className="t-out" variants={printOut} initial={reduce ? false : 'hidden'} animate={done ? 'visible' : 'hidden'}>
          {children}
        </motion.div>
      )}
    </>
  )
}

/** A tiled window. Clicking its background (not a control inside it) opens it. */
function Win({
  id,
  title,
  className,
  layoutId,
  active,
  onActive,
  onOpen,
  hint = '⏎ open',
  children,
}: {
  id: string
  title: string
  className: string
  layoutId?: string
  active: string | null
  onActive: (id: string) => void
  onOpen?: () => void
  hint?: string
  children: ReactNode
}) {
  const onClick = (e: MouseEvent) => {
    if (!onOpen || (e.target as HTMLElement).closest('a, button, input')) return
    onOpen()
  }
  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Enter' && e.target === e.currentTarget && onOpen) {
      e.preventDefault()
      onOpen()
    }
  }
  return (
    <motion.section
      data-win={id}
      tabIndex={0}
      className={`tw ${className}${onOpen ? ' tw--opens' : ''}${active === id ? ' is-active' : ''}`}
      variants={popIn}
      onPointerEnter={() => onActive(id)}
      onFocus={() => onActive(id)}
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-label={title}
    >
      <motion.div className="tw__bg" layoutId={layoutId} style={{ borderRadius: RADIUS }} />
      <p className="tw__title" aria-hidden>
        {title}
      </p>
      {onOpen && (
        <span className="tw__hint" aria-hidden>
          {hint}
        </span>
      )}
      <div className="tw__body">{children}</div>
    </motion.section>
  )
}

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

// ---------------------------------------------------------------------------------------------
// the shell in the first window

const COMMANDS = ['help', 'about', 'work', 'projects', 'skills', 'open', 'cv', 'email', 'github', 'linkedin', 'whoami', 'ls', 'pwd', 'date', 'clear']

const TARGETS: Record<string, string> = {
  about: 'about',
  ...Object.fromEntries(experience.map((e) => [slug(e.company), `role:${e.company}`])),
  ...Object.fromEntries(projects.map((p) => [slug(p.name), `project:${p.name}`])),
}

type Entry = { id: number; cmd: string; out: ReactNode }

function Shell({
  ready,
  onOpen,
  inputRef,
  scrollRef,
}: {
  ready: boolean
  onOpen: (id: string) => void
  inputRef: RefObject<HTMLInputElement | null>
  scrollRef: RefObject<HTMLDivElement | null>
}) {
  const [log, setLog] = useState<Entry[]>([])
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [cursor, setCursor] = useState(-1)
  const nextId = useRef(0)

  // follow new output, but leave the boot text in view until something is typed
  useEffect(() => {
    const el = scrollRef.current
    if (el && log.length) el.scrollTop = el.scrollHeight
  }, [log, scrollRef])

  const opener = (id: string, label: string) => {
    onOpen(id)
    return <p className="t-dim">opening {label}</p>
  }

  const exec = (raw: string): ReactNode | 'clear' => {
    const [name = '', ...args] = raw.trim().split(/\s+/)
    const arg = args.join(' ').toLowerCase()
    switch (name.toLowerCase()) {
      case '':
        return null
      case 'help':
        return (
          <div className="t-help">
            {[
              ['about', 'who I am and what I’ve built'],
              ['work', 'where I’ve worked'],
              ['projects', 'things I’ve built on my own'],
              ['skills', 'tools I use'],
              ['open <name>', 'open a window, e.g. open workouter'],
              ['clear', 'clear the screen'],
            ].map(([c, d]) => (
              <p key={c} className="t-help__row">
                <span className="t-key">{c}</span> <span className="t-dim">{d}</span>
              </p>
            ))}
            <p>
              also: <span className="t-key">cv</span>, <span className="t-key">email</span>,{' '}
              <span className="t-key">github</span>, <span className="t-key">linkedin</span>
            </p>
            <p className="t-dim">Tab completes, ↑ brings back the last command. Or just click any window.</p>
          </div>
        )
      case 'about':
        return opener('about', 'about.md')
      case 'whoami':
        return <p>{profile.name}</p>
      case 'work':
        return (
          <div>
            {experience.map((e) => (
              <p key={e.company}>
                <button className="t-dir" onClick={() => onOpen(`role:${e.company}`)}>
                  {slug(e.company)}/
                </button>{' '}
                {e.role} <span className="t-dim t-date">{e.period}</span>
              </p>
            ))}
          </div>
        )
      case 'projects':
        return (
          <div>
            {projects.map((p) => (
              <p key={p.name}>
                <button className="t-dir" onClick={() => onOpen(`project:${p.name}`)}>
                  {slug(p.name)}/
                </button>{' '}
                <span className="t-dim">{p.stack.slice(0, 3).join(', ')}</span>
              </p>
            ))}
          </div>
        )
      case 'skills':
        return (
          <div>
            {toolGroups.map((g) => (
              <p key={g.key}>
                <span className="t-key">{g.key}</span> {g.tools.join(', ')}
              </p>
            ))}
          </div>
        )
      case 'ls':
        return (
          <p>
            <span className="t-dir">work/</span> <span className="t-dir">projects/</span> about.md built.md
          </p>
        )
      case 'pwd':
        return <p>/home/aditya</p>
      case 'date':
        return <p>{new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })} IST</p>
      case 'cd':
        return <p className="t-dim">try: open {arg || 'workouter'}</p>
      case 'open': {
        const id = TARGETS[slug(arg)]
        if (id) return opener(id, arg)
        return (
          <p className="t-dim">
            open: nothing called “{arg}”. Try one of: {Object.keys(TARGETS).join(', ')}
          </p>
        )
      }
      case 'cv':
        window.open(profile.resume, '_blank', 'noopener')
        return <p className="t-dim">opening the CV (PDF)</p>
      case 'email':
      case 'mail':
        window.location.href = `mailto:${profile.email}`
        return <p className="t-dim">opening your mail app · {profile.email}</p>
      case 'github':
        window.open(profile.github, '_blank', 'noopener')
        return <p className="t-dim">opening GitHub</p>
      case 'linkedin':
        window.open(profile.linkedin, '_blank', 'noopener')
        return <p className="t-dim">opening LinkedIn</p>
      case 'clear':
        return 'clear'
      default:
        return (
          <p className="t-dim">
            zsh: command not found: {name}. Try <span className="t-key">help</span>.
          </p>
        )
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const out = exec(value)
    if (out === 'clear') setLog([])
    else setLog((l) => [...l, { id: nextId.current++, cmd: value, out }])
    if (value.trim()) setHistory((h) => [...h, value])
    setCursor(-1)
    setValue('')
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const parts = value.split(/\s+/)
      const pool = parts.length > 1 && parts[0] === 'open' ? Object.keys(TARGETS) : COMMANDS
      const last = parts[parts.length - 1].toLowerCase()
      const hits = pool.filter((c) => c.startsWith(last))
      if (hits.length === 1) setValue([...parts.slice(0, -1), hits[0]].join(' ') + ' ')
      else if (hits.length > 1)
        setLog((l) => [...l, { id: nextId.current++, cmd: value, out: <p className="t-dim">{hits.join('  ')}</p> }])
    } else if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault()
      const c = cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1)
      setCursor(c)
      setValue(history[c])
    } else if (e.key === 'ArrowDown' && cursor >= 0) {
      e.preventDefault()
      const c = cursor + 1
      setCursor(c >= history.length ? -1 : c)
      setValue(c >= history.length ? '' : history[c])
    } else if (e.key === 'Escape') {
      inputRef.current?.blur()
    }
  }

  if (!ready) return null
  return (
    <>
      {log.map((entry) => (
        <div key={entry.id} className="t-entry">
          <p className="t-l t-cmdline">
            <Prompt />
            {entry.cmd}
          </p>
          {entry.out}
        </div>
      ))}
      <form className="t-l t-cmdline t-form" onSubmit={submit}>
        <Prompt />
        <input
          ref={inputRef}
          className="t-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Type a command, or help"
          placeholder="type help"
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
        />
      </form>
    </>
  )
}

// ---------------------------------------------------------------------------------------------
// the floating window a tiled window opens into

function floatTitle(id: string) {
  if (id === 'about') return '~/about.md'
  const [kind, name] = id.split(':')
  return kind === 'role' ? `~/work/${slug(name)}.md` : `~/projects/${slug(name)}/README.md`
}

function Stack({ items }: { items: string[] }) {
  return (
    <>
      <L className="f-h2">## stack</L>
      <L className="tags">
        {items.map((s) => (
          <Tag name={s} key={s} usage={usageFor(s)} />
        ))}
      </L>
    </>
  )
}

function FloatBody({ id }: { id: string }) {
  if (id === 'about') {
    return (
      <>
        <L className="f-h1"># about</L>
        {about.map((p) => (
          <L className="f-p" key={p.slice(0, 24)}>
            {p}
          </L>
        ))}
        <L className="f-h2">## things I’ve built</L>
        {built.map((b) => (
          <L className="f-built" key={b.key}>
            <span className="t-key">{b.key}</span> <span className="t-dim">· {b.where}</span>
            <span className="f-built__text">{b.long}</span>
          </L>
        ))}
        <L className="f-h2">## outside work</L>
        <L className="f-p">{outsideWork}</L>
        <L className="f-h2">## education</L>
        {education.map((ed) => (
          <L className="f-p" key={ed.school}>
            {ed.degree}, {ed.school} · <span className="t-dim t-date">{ed.period}</span>
          </L>
        ))}
      </>
    )
  }

  const [kind, name] = id.split(':')
  if (kind === 'role') {
    const job = experience.find((e) => e.company === name)
    if (!job) return null
    return (
      <>
        <L className="f-h1">
          # {job.role} · <span className="t-accent">{job.company}</span>
        </L>
        <L className="t-dim">
          <span className="t-date">{job.period}</span> · {job.location}
        </L>
        <ul className="f-points">
          {job.points.map((p) => (
            <motion.li key={p.slice(0, 24)} variants={line}>
              {p}
            </motion.li>
          ))}
        </ul>
        <Stack items={job.stack} />
      </>
    )
  }

  const p = projects.find((x) => x.name === name)
  if (!p) return null
  return (
    <>
      <L className="f-h1"># {p.name}</L>
      <L className="t-dim t-date">{p.period}</L>
      <L className="f-p">{p.blurb}</L>
      <ul className="f-points">
        {p.points.map((pt) => (
          <motion.li key={pt.slice(0, 24)} variants={line}>
            {pt}
          </motion.li>
        ))}
      </ul>
      <Stack items={p.stack} />
      {p.link && (
        <L>
          <a className="t-link" href={p.link.href} target="_blank" rel="noreferrer">
            {p.link.label} ↗
          </a>
        </L>
      )}
    </>
  )
}

function Float({ id, onClose }: { id: string; onClose: () => void }) {
  const { reduce } = useMotion()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      className="tf"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="tf__win" role="dialog" aria-modal="true" aria-label={floatTitle(id)}>
        <motion.div
          className="tw__bg tf__bg"
          layoutId={`win-${id}`}
          style={{ borderRadius: RADIUS }}
          transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
        />
        <p className="tw__title" aria-hidden>
          {floatTitle(id)}
        </p>
        <button ref={closeRef} className="tf__close" onClick={onClose} aria-label="Close">
          [x]
        </button>
        <motion.div
          className="tf__body"
          variants={{ hidden: {}, visible: { transition: { delayChildren: reduce ? 0 : 0.22, staggerChildren: 0.035 } } }}
          initial={reduce ? false : 'hidden'}
          animate="visible"
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
        >
          <FloatBody id={id} />
        </motion.div>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------------------------

function useClock() {
  const fmt = () =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date())
  const [now, setNow] = useState(fmt)
  useEffect(() => {
    const id = window.setInterval(() => setNow(fmt()), 15000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

/** hjkl / arrows move focus to the nearest window in that direction. */
function neighbour(from: HTMLElement | null, dir: 'l' | 'r' | 'u' | 'd') {
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

const KEYS: Record<string, 'l' | 'r' | 'u' | 'd'> = {
  h: 'l',
  ArrowLeft: 'l',
  l: 'r',
  ArrowRight: 'r',
  k: 'u',
  ArrowUp: 'u',
  j: 'd',
  ArrowDown: 'd',
}

export default function TerminalHome() {
  const { reduce } = useMotion()
  const fontsReady = useFontsReady()
  const clock = useClock()
  const [openId, setOpenId] = useState<string | null>(null)
  const [active, setActive] = useState<string | null>('about')
  const [step, setStep] = useState(0)
  const returnFocus = useRef<HTMLElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const kittyRef = useRef<HTMLDivElement>(null)

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
      neighbour(current, dir)?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openId])

  const [workouter, typeduel, rore] = projects
  const win = { active, onActive: setActive }

  return (
    <BootContext.Provider value={fontsReady}>
      <div className="term">
        <motion.header
          className="tbar"
          initial={reduce ? false : { opacity: 0, y: -12 }}
          animate={fontsReady ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <span className="tbar__host">
            <span className="tbar__ws">1</span> aditya@portfolio
          </span>
          <span className="tbar__clock">Hyderabad · {clock} IST</span>
          <nav className="tbar__links" aria-label="Links">
            <span className="tbar__keys" aria-hidden>
              hjkl move · ⏎ open · / type
            </span>
            <a href={profile.resume} target="_blank" rel="noreferrer">
              <DownloadIcon className="" /> cv
            </a>
            <a href={profile.github} target="_blank" rel="noreferrer">
              <GithubIcon /> github
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer">
              <LinkedinIcon /> linkedin
            </a>
            <a href={`mailto:${profile.email}`}>
              <MailIcon className="" /> email
            </a>
          </nav>
        </motion.header>

        <motion.main className="tdesk" variants={desk} initial="hidden" animate={fontsReady ? 'visible' : 'hidden'}>
          <Win
            id="about"
            title="kitty · ~"
            className="w-kitty"
            layoutId="win-about"
            {...win}
            onOpen={() => inputRef.current?.focus()}
            hint="/ type"
          >
            <div className="kitty" ref={kittyRef}>
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
              <Shell ready={step >= 2} onOpen={open} inputRef={inputRef} scrollRef={kittyRef} />
            </div>
          </Win>

          <Win id="fastfetch" title="fastfetch" className="w-ff" {...win}>
            <Cmd cmd="fastfetch" delay={after(1)}>
              <L className="ff-head">
                <span className="t-accent">aditya</span>@<span className="t-accent">portfolio</span>
              </L>
              <L className="t-dim ff-rule">────────────────</L>
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

          <Win id="work" title="~/work" className="w-work" {...win}>
            <Cmd cmd="ls ~/work" delay={after(2)}>
              {experience.map((job) => (
                <L key={job.company}>
                  <button className="t-row" onClick={() => open(`role:${job.company}`)}>
                    <motion.span className="t-row__bg" layoutId={`win-role:${job.company}`} style={{ borderRadius: 6 }} />
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
            title="~/projects/workouter"
            className="w-workouter"
            layoutId={`win-project:${workouter.name}`}
            {...win}
            onOpen={() => open(`project:${workouter.name}`)}
          >
            <ProjectHead name={workouter.name} />
            {workouter.log && (
              <Cmd cmd="workouter plan --week 5 --day 1" delay={after(3) + 0.3}>
                <L>
                  <AgentLog title={workouter.log.title} lines={workouter.log.lines} loop />
                </L>
              </Cmd>
            )}
          </Win>

          <Win
            id={`project:${typeduel.name}`}
            title="~/projects/typeduel"
            className="w-typeduel"
            layoutId={`win-project:${typeduel.name}`}
            {...win}
            onOpen={() => open(`project:${typeduel.name}`)}
          >
            <ProjectHead name={typeduel.name} />
            <Cmd cmd="typeduel --ghost" delay={after(4) + 0.3}>
              <L>
                <TypeRace loop />
              </L>
            </Cmd>
          </Win>

          <Win
            id={`project:${rore.name}`}
            title="~/projects/rore"
            className="w-rore"
            layoutId={`win-project:${rore.name}`}
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

          <Win id="contact" title="~/contact" className="w-contact" {...win}>
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
