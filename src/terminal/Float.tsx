// The floating window a tiled window (or a role row) opens into, and what it shows.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, usePresence } from 'framer-motion'
import { about, built, education, experience, outsideWork, projects } from '../content'
import { Tag } from '../components/Tag'
import { useMotion } from '../motion/features'
import { usageFor } from '../skillUsage'
import { L } from './print'
import { RADIUS, FLOAT } from './shared'
import { winEl, floatTitle } from './tiling'
import { line } from './timing'

// the floating window a tiled window opens into

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

/** What a floating window grows out of: a role row, or the tiled window itself. */
const originOf = (id: string) => document.querySelector<HTMLElement>(`[data-origin="${CSS.escape(id)}"]`) ?? winEl(id)

type Box = { l: number; t: number; w: number; h: number }

/**
 * The floating window. Its frame starts on the exact rectangle of what was clicked (a tiled
 * window or a role row) and grows to full size; on close it shrinks back to wherever that
 * thing is by then, even if the window has been moved since.
 */
export function Float({ id, onClose }: { id: string; onClose: () => void }) {
  const { reduce } = useMotion()
  const [isPresent, safeToRemove] = usePresence()
  const closeRef = useRef<HTMLButtonElement>(null)
  const winRef = useRef<HTMLDivElement>(null)
  const left = useMotionValue(0)
  const top = useMotionValue(0)
  const width = useMotionValue(0)
  const height = useMotionValue(0)
  const [grown, setGrown] = useState(false)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // both directions: where the frame is now (full window) and where the origin is
  useLayoutEffect(() => {
    const win = winRef.current
    if (!win) return
    const w = win.getBoundingClientRect()
    const o = originOf(id)?.getBoundingClientRect()
    const full: Box = { l: 0, t: 0, w: w.width, h: w.height }
    const origin: Box | null = o && o.width ? { l: o.left - w.left, t: o.top - w.top, w: o.width, h: o.height } : null
    const set = (b: Box) => {
      left.set(b.l)
      top.set(b.t)
      width.set(b.w)
      height.set(b.h)
    }
    const tween = (b: Box) =>
      Promise.all([
        animate(left, b.l, FLOAT),
        animate(top, b.t, FLOAT),
        animate(width, b.w, FLOAT),
        animate(height, b.h, FLOAT),
      ])

    if (isPresent) {
      set(reduce || !origin ? full : origin)
      tween(full).then(() => setGrown(true))
    } else {
      set(full)
      if (reduce || !origin) safeToRemove?.()
      else tween(origin).then(() => safeToRemove?.())
    }
  }, [isPresent, id, reduce, left, top, width, height, safeToRemove])

  // once grown, the frame just fills the window (so it follows if the viewport changes)
  const frame = grown && isPresent ? { left: 0, top: 0, width: '100%', height: '100%' } : { left, top, width, height }

  return (
    <div
      className="tf"
      onMouseDown={(e) => {
        const t = e.target as HTMLElement
        if (t === e.currentTarget || t.classList.contains('tf__backdrop')) onClose()
      }}
    >
      <motion.div
        className="tf__backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />
      <div ref={winRef} className="tf__win" role="dialog" aria-modal="true" aria-label={floatTitle(id)}>
        <motion.div
          className="tw__bg tf__bg"
          style={{
            ...frame,
            right: 'auto',
            bottom: 'auto',
            borderRadius: RADIUS,
          }}
        />
        <motion.div
          initial={{ opacity: reduce ? 1 : 0 }}
          animate={{
            opacity: 1,
            transition: { delay: reduce ? 0 : 0.18, duration: 0.2 },
          }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
        >
          <p className="tw__title" aria-hidden>
            {floatTitle(id)}
          </p>
          <button ref={closeRef} className="tf__close" onClick={onClose} aria-label="Close">
            [x]
          </button>
        </motion.div>
        <motion.div
          className="tf__body"
          variants={{
            hidden: {},
            visible: {
              transition: {
                delayChildren: reduce ? 0 : 0.22,
                staggerChildren: 0.035,
              },
            },
          }}
          initial={reduce ? false : 'hidden'}
          animate="visible"
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
        >
          <FloatBody id={id} />
        </motion.div>
      </div>
    </div>
  )
}
