// Boot timing and the print effect: when each window pops in, and the variants that make
// output fade in line by line. Also the hook that types a command out.
// Windows pop in one after another, then each types its command.
import { createContext, useEffect, useState } from 'react'
import { type Variants } from 'framer-motion'
import { EASE } from '../motion/boot'

const POP_START = 0.35
const POP_STEP = 0.11
const POP_DUR = 0.34
/** When window `i` has finished popping in (seconds after load). */
export const after = (i: number) => POP_START + i * POP_STEP + POP_DUR

export const desk: Variants = { hidden: {}, visible: {} }
// each window pops in by its boot order (`custom`), wherever it has been moved to
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: POP_START + i * POP_STEP,
      duration: POP_DUR,
      ease: EASE,
    },
  }),
}
export const printOut: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}
export const printHead: Variants = {
  hidden: {},
  visible: {
    transition: { delayChildren: POP_DUR * 0.6, staggerChildren: 0.06 },
  },
}
export const line: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.14 } },
}

/** False until the fonts are in, so typing never starts on fallback metrics. */
export const BootContext = createContext(false)

/** Types `text` out once `run` is true, after `delay` seconds. Instant under reduced motion. */
export function useTyped(text: string, run: boolean, delay: number, reduce: boolean) {
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
