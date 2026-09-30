// The prompt in the first window: a handful of commands, Tab completion and history.
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { built, experience, profile, projects, toolGroups } from '../content'
import { Prompt } from './print'
import { slug } from './shared'

// the shell in the first window

// Every command the windows show on screen works when typed: whoami, cat, ls, fastfetch,
// workouter, typeduel. The "files" are the ones ls lists.
const FILES = ['about.md', 'built.md', 'contact']
const DIRS = ['work', 'projects']

const COMMANDS = [
  'help',
  'cat',
  'fastfetch',
  'workouter',
  'typeduel',
  'about',
  'work',
  'projects',
  'skills',
  'open',
  'reset',
  'cv',
  'email',
  'github',
  'linkedin',
  'whoami',
  'ls',
  'pwd',
  'date',
  'clear',
]

const TARGETS: Record<string, string> = {
  about: 'about',
  ...Object.fromEntries(experience.map((e) => [slug(e.company), `role:${e.company}`])),
  ...Object.fromEntries(projects.map((p) => [slug(p.name), `project:${p.name}`])),
}

type Entry = { id: number; cmd: string; out: ReactNode }

export function Shell({
  ready,
  onOpen,
  onReset,
  inputRef,
  scrollRef,
}: {
  ready: boolean
  onOpen: (id: string) => void
  onReset: () => void
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

  const work = () => (
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
  const projectList = () => (
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
  const skills = () => (
    <div>
      {toolGroups.map((g) => (
        <p key={g.key}>
          <span className="t-key">{g.key}</span> {g.tools.join(', ')}
        </p>
      ))}
    </div>
  )

  /** `cat`: the files ls lists, plus a role's page (work/pulsegen.md) */
  const cat = (arg: string) => {
    const file = arg.replace(/^(~\/|\.\/)/, '')
    if (!file) return <p className="t-dim">cat: which file? try: cat about.md</p>
    if (file === 'about.md') return opener('about', 'about.md')
    if (file === 'built.md')
      return (
        <div>
          {built.map((b) => (
            <p key={b.key}>
              <span className="t-key">{b.key}</span> {b.short} <span className="t-dim">· {b.where}</span>
            </p>
          ))}
        </div>
      )
    if (file === 'contact')
      return (
        <div>
          <p>Open to mid-level full-stack roles. Email is fastest.</p>
          <p className="t-dim">{profile.email}</p>
        </div>
      )
    const role = file.match(/^work\/(\w+)(\.md)?$/)?.[1]
    const id = role && TARGETS[role]
    if (id) return opener(id, file)
    return <p className="t-dim">cat: {arg}: No such file or directory</p>
  }

  /** `ls`: home, ~/work or ~/projects */
  const ls = (arg: string) => {
    const dir = arg.replace(/^~\/?|^\.\/?/, '').replace(/\/$/, '')
    if (!dir)
      return (
        <p>
          <span className="t-dir">work/</span> <span className="t-dir">projects/</span> {FILES.join(' ')}
        </p>
      )
    if (dir === 'work') return work()
    if (dir === 'projects') return projectList()
    return <p className="t-dim">ls: cannot access '{arg}': No such file or directory</p>
  }

  const exec = (raw: string): ReactNode | 'clear' => {
    const [name = '', ...args] = raw.trim().split(/\s+/)
    const arg = args.join(' ').toLowerCase()
    switch (name.toLowerCase()) {
      case '':
        return null
      case 'help':
        return (
          <div>
            {[
              ['about', 'who I am and what I’ve built'],
              ['work', 'where I’ve worked'],
              ['projects', 'things I’ve built on my own'],
              ['skills', 'tools I use'],
              ['cat <file>', 'read a file: about.md, built.md, contact'],
              ['ls [dir]', 'list files, or ~/work, ~/projects'],
              ['open <name>', 'open a window, e.g. open workouter'],
              ['reset', 'put the windows back where they were'],
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
            <p className="t-dim">
              Windows: drag a title bar (or alt + drag) onto another window to swap them, drag the gap between two to
              resize, double-click a gap to even it out. hjkl moves focus, shift + hjkl swaps.
            </p>
          </div>
        )
      case 'about':
        return opener('about', 'about.md')
      case 'whoami':
        return <p>{profile.name}</p>
      case 'work':
        return work()
      case 'projects':
        return projectList()
      case 'skills':
      case 'fastfetch':
        return skills()
      case 'cat':
        return cat(arg)
      case 'ls':
        return ls(arg)
      case 'workouter':
        return opener('project:Workouter', 'workouter')
      case 'typeduel':
        return opener('project:TypeDuel', 'typeduel')
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
      case 'reset':
        onReset()
        return <p className="t-dim">windows back in place</p>
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
      const first = parts[0].toLowerCase()
      const pool =
        parts.length === 1
          ? COMMANDS
          : first === 'open'
            ? Object.keys(TARGETS)
            : first === 'cat'
              ? FILES
              : first === 'ls'
                ? DIRS.map((d) => `~/${d}`)
                : []
      const last = parts[parts.length - 1].toLowerCase()
      const hits = pool.filter((c) => c.startsWith(last))
      if (hits.length === 1) setValue([...parts.slice(0, -1), hits[0]].join(' ') + ' ')
      else if (hits.length > 1)
        setLog((l) => [
          ...l,
          {
            id: nextId.current++,
            cmd: value,
            out: <p className="t-dim">{hits.join('  ')}</p>,
          },
        ])
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
