import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { useMotion } from '../motion/features'
import type { LogLine } from '../content'

const STEP_MS = 520
// with `loop`, the finished log stays up this many steps (~4s) before it prints again
const HOLD_STEPS = 8

const MARK: Record<LogLine['kind'], string> = { call: '→', warn: '!', refused: '✕', ok: '✓' }

/**
 * A short agent run printed line by line when it comes into view. With `loop` it holds the
 * finished log for a few seconds and prints again, while it stays on screen.
 */
export function AgentLog({ title, lines, loop = false }: { title: string; lines: LogLine[]; loop?: boolean }) {
  const { reduce } = useMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: !loop, amount: 0.5 })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (reduce || !inView) return
    const id = window.setInterval(() => {
      setCount((c) => {
        if (loop) return c >= lines.length + HOLD_STEPS ? 0 : c + 1
        if (c + 1 >= lines.length) window.clearInterval(id)
        return Math.min(c + 1, lines.length)
      })
    }, STEP_MS)
    return () => window.clearInterval(id)
  }, [reduce, inView, lines.length, loop])

  const shown = reduce ? lines.length : Math.min(count, lines.length)

  return (
    <div ref={ref} className="inset log">
      <p className="inset__title">{title}</p>
      <ol className="log__lines">
        {lines.map((l, i) => (
          <li key={i} className={`log__line log__line--${l.kind}${i < shown ? ' is-shown' : ''}`}>
            <span className="log__mark" aria-hidden>
              {MARK[l.kind]}
            </span>
            <span>{l.text}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
