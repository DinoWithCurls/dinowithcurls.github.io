import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'
import { MotionContext } from './context'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

const getReduce = () => window.matchMedia(QUERY).matches

export function MotionProvider({ children }: { children: ReactNode }) {
  const reduce = useSyncExternalStore(subscribe, getReduce)

  // CSS keys its reduced-motion rules off this attribute (index.html sets it before first paint).
  useEffect(() => {
    document.documentElement.dataset.motion = reduce ? 'reduce' : 'full'
  }, [reduce])

  // "always" keeps Framer's opacity fades but drops movement (y, scale), so the reduced
  // version still eases in rather than popping.
  return (
    <MotionContext.Provider value={{ reduce }}>
      <MotionConfig reducedMotion={reduce ? 'always' : 'never'}>{children}</MotionConfig>
    </MotionContext.Provider>
  )
}
