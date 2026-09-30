import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { useMotion } from '../motion/features'

// TypeDuel pulls passages from Wikipedia; this is a short one of the same kind.
const PASSAGE = 'The Nile is a major north-flowing river in northeastern Africa.'
const GHOST_MS = 70
// A human rhythm: mostly quick, with the odd hesitation, ending a little ahead of the ghost.
const rhythm = (i: number) => (i % 11 === 7 ? 180 : i % 5 === 2 ? 85 : 52)

const HOLD_MS = 4000

/**
 * An illustration of a TypeDuel race: your caret against a ghost. Plays once in view, or with
 * `loop`, plays, holds the finish for a few seconds and starts again while it stays on screen.
 */
export function TypeRace({ loop = false }: { loop?: boolean }) {
  const { reduce } = useMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: !loop, amount: 0.6 })
  const [you, setYou] = useState(0)
  const [ghost, setGhost] = useState(0)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (reduce || !inView) return
    let youTimer = 0
    let ghostTimer = 0
    let i = 0
    const stepYou = () => {
      i += 1
      setYou(i)
      if (i < PASSAGE.length) youTimer = window.setTimeout(stepYou, rhythm(i))
      else if (loop) youTimer = window.setTimeout(() => setCycle((c) => c + 1), HOLD_MS)
    }
    youTimer = window.setTimeout(() => {
      setYou(0)
      setGhost(0)
      ghostTimer = window.setInterval(() => {
        setGhost((g) => {
          if (g + 1 >= PASSAGE.length) window.clearInterval(ghostTimer)
          return Math.min(g + 1, PASSAGE.length)
        })
      }, GHOST_MS)
      stepYou()
    }, 300)
    return () => {
      window.clearTimeout(youTimer)
      window.clearInterval(ghostTimer)
    }
  }, [reduce, inView, loop, cycle])

  const y = reduce ? PASSAGE.length : you
  const g = reduce ? PASSAGE.length - 6 : ghost
  const done = y >= PASSAGE.length

  return (
    <div ref={ref} className="inset race" role="img" aria-label="Illustration of a TypeDuel race against a ghost opponent.">
      <p className="inset__title">illustration · you vs ghost</p>
      <p className="race__text" aria-hidden>
        {PASSAGE.split('').map((ch, i) => (
          <span
            key={i}
            className={[i < y ? 'is-typed' : '', i === g && !done ? 'is-ghost' : ''].join(' ')}
          >
            {i === y && !done && <span className="race__caret" />}
            {ch}
          </span>
        ))}
      </p>
      <p className="inset__caption">{done ? 'you finished first · rematch?' : 'racing…'}</p>
    </div>
  )
}
