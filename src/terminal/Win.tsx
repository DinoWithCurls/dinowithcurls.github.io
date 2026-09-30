// A tiled window: drag it by its title bar to swap it with another, drag the gap on its left
// to resize, click it to open. Flip makes every slot change fly instead of jump.
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { animate, motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion'
import { useMotion } from '../motion/features'
import { RADIUS, FLIGHT } from './shared'
import { BOOT_ORDER } from './tiling'
import { popIn } from './timing'

export type Place = {
  row: number
  start: number
  span: number
  first: boolean
}

/**
 * A tiled window. Clicking its background (not a control inside it) opens it. Like a tiling WM,
 * dragging its title bar (or alt + drag anywhere) over another window swaps the two live: the
 * other one slides into this one's old slot, a dashed outline shows where this one will land,
 * and letting go flies it in. Esc during a drag cancels. Dragging the gap on its left resizes
 * it against its neighbour.
 */
export function Win({
  id,
  title,
  className,
  active,
  onActive,
  onOpen,
  hint = '⏎ open',
  place,
  movable,
  instant,
  onDragStart,
  onDragOver,
  onDragEnd,
  onResize,
  onResetRow,
  minHeight,
  children,
}: {
  id: string
  title: string
  className: string
  active: string | null
  onActive: (id: string) => void
  onOpen?: () => void
  hint?: string
  place: Place
  movable: boolean
  /** true while a gap is being dragged: slots change every frame and must not animate */
  instant: boolean
  onDragStart: () => void
  onDragOver: (id: string, x: number, y: number) => void
  onDragEnd: (cancelled: boolean) => void
  onResize: (e: ReactPointerEvent) => void
  onResetRow: () => void
  minHeight?: number
  children: ReactNode
}) {
  const { reduce } = useMotion()
  const ref = useRef<HTMLElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const dragged = useRef(false)
  const dragging = useRef(false)
  // pointer position minus window offset; kept in a ref so a mid-drag slot change can shift it
  const anchor = useRef({ x: 0, y: 0 })
  const [lifted, setLifted] = useState(false)
  // the latest parent callbacks, for listeners that outlive the render they were made in
  const calls = useRef({ onDragStart, onDragOver, onDragEnd })
  useEffect(() => {
    calls.current = { onDragStart, onDragOver, onDragEnd }
  })
  // the landing slot: the outline sits at the layout position, undoing the drag offset
  const slotX = useTransform(x, (v) => -v)
  const slotY = useTransform(y, (v) => -v)

  const land = () => {
    animate(x, 0, FLIGHT)
    animate(y, 0, FLIGHT).then(() => setLifted(false))
  }

  const onPointerDown = (e: ReactPointerEvent) => {
    dragged.current = false
    if (!movable || e.button !== 0) return
    if (!(e.target as HTMLElement).closest('.tw__grab') && !e.altKey) return
    e.preventDefault()
    anchor.current = { x: e.clientX - x.get(), y: e.clientY - y.get() }
    x.stop()
    y.stop()
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - anchor.current.x
      const dy = ev.clientY - anchor.current.y
      if (!dragged.current) {
        if (Math.hypot(dx - x.get(), dy - y.get()) < 4) return
        dragged.current = true
        dragging.current = true
        setLifted(true)
        calls.current.onDragStart()
      }
      x.set(dx)
      y.set(dy)
      calls.current.onDragOver(id, ev.clientX, ev.clientY)
    }
    const finish = (cancelled: boolean) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('keydown', key, true)
      if (!dragged.current) return
      dragging.current = false
      calls.current.onDragEnd(cancelled)
      land()
    }
    const up = () => finish(false)
    const key = (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape') return
      ev.stopPropagation()
      finish(true)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('keydown', key, true)
  }

  // while dragging, a slot change must not tug the window away from the pointer: shift the
  // anchor instead of flying
  const onShift = (dx: number, dy: number) => {
    if (!dragging.current) return false
    anchor.current = { x: anchor.current.x - dx, y: anchor.current.y - dy }
    return true
  }

  const onClick = (e: MouseEvent) => {
    if (dragged.current) {
      dragged.current = false
      return
    }
    if (!onOpen || (e.target as HTMLElement).closest('a, button, input, [data-keep]')) return
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
      ref={ref}
      data-win={id}
      tabIndex={0}
      className={`tw ${className}${onOpen ? ' tw--opens' : ''}${active === id ? ' is-active' : ''}${
        lifted ? ' is-lifted' : ''
      }`}
      custom={BOOT_ORDER.indexOf(id)}
      variants={popIn}
      style={
        movable
          ? {
              x,
              y,
              gridRow: place.row + 1,
              gridColumn: `${place.start} / span ${place.span}`,
              marginLeft: place.first ? 0 : 'var(--t-gap)',
              minHeight: minHeight || undefined,
            }
          : undefined
      }
      onPointerDown={onPointerDown}
      onPointerEnter={() => onActive(id)}
      onFocus={() => onActive(id)}
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-label={title}
    >
      <Flip
        x={x}
        y={y}
        slot={`${place.row}:${place.start}:${place.span}`}
        off={instant || reduce || !movable}
        onShift={onShift}
        onLanded={() => setLifted(false)}
      />
      {lifted && <motion.div className="tw__slot" style={{ x: slotX, y: slotY, borderRadius: RADIUS }} aria-hidden />}
      <div className="tw__bg" style={{ borderRadius: RADIUS }} />
      {movable && <div className="tw__grab" aria-hidden />}
      {movable && !place.first && (
        <div className="tw__resize" onPointerDown={onResize} onDoubleClick={onResetRow} aria-hidden />
      )}
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

/**
 * FLIP for a tiled window: when its slot changes, start it where it was on screen and fly it
 * home (for the dragged window that is the drop point; for the one it swapped with, its old
 * slot). It finds its window through a hidden probe element: a child's layout effect runs
 * before the parent's own ref is attached, so a ref to the window would still be empty here on
 * the first render.
 */
function Flip({
  x,
  y,
  slot,
  off,
  onShift,
  onLanded,
}: {
  x: MotionValue<number>
  y: MotionValue<number>
  slot: string
  off: boolean
  /** called first; returning true means "I'm being dragged: keep me put, don't fly" */
  onShift: (dx: number, dy: number) => boolean
  onLanded: () => void
}) {
  const probe = useRef<HTMLSpanElement>(null)
  const last = useRef<{ l: number; t: number } | null>(null)
  const landed = useRef(onLanded)
  const shift = useRef(onShift)
  useEffect(() => {
    landed.current = onLanded
    shift.current = onShift
  })
  useLayoutEffect(() => {
    const node = probe.current?.parentElement
    if (!node) return
    const now = { l: node.offsetLeft, t: node.offsetTop }
    const before = last.current
    last.current = now
    if (!before || off) return
    const dx = before.l - now.l
    const dy = before.t - now.t
    if (!dx && !dy) return
    x.set(x.get() + dx)
    y.set(y.get() + dy)
    if (shift.current(dx, dy)) return
    animate(x, 0, FLIGHT)
    animate(y, 0, FLIGHT).then(() => landed.current())
  }, [x, y, slot, off])

  // keep the remembered position honest when the viewport itself changes size
  useEffect(() => {
    const onResize = () => {
      const node = probe.current?.parentElement
      if (node) last.current = { l: node.offsetLeft, t: node.offsetTop }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return <span ref={probe} hidden />
}
