// How the terminal prints: windows pop in on boot, each command types itself out, then its
// output fades in line by line.
import { useContext, useEffect, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useMotion } from '../motion/features'
import { printOut, line, BootContext, useTyped } from './timing'

/** One printed line; it fades in with its block's stagger. */
export function L({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div className={`t-l${className ? ` ${className}` : ''}`} variants={line}>
      {children}
    </motion.div>
  )
}

export function Prompt({ cwd = '~' }: { cwd?: string }) {
  return (
    <span className="t-prompt" aria-hidden>
      <span className="t-cwd">{cwd}</span> <span className="t-arrow">❯</span>{' '}
    </span>
  )
}

/** A command that types itself, then prints its output (children made of <L> lines). */
export function Cmd({
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
        <motion.div
          className="t-out"
          variants={printOut}
          initial={reduce ? false : 'hidden'}
          animate={done ? 'visible' : 'hidden'}
        >
          {children}
        </motion.div>
      )}
    </>
  )
}
