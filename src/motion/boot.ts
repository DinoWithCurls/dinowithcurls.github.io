import { useEffect, useState } from 'react'

export const EASE = [0.22, 1, 0.36, 1] as const

/** True once the web fonts have loaded (or after a second), so nothing types on fallback metrics. */
export function useFontsReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let done = false
    const finish = () => {
      if (!done) setReady(true)
      done = true
    }
    document.fonts?.ready.then(finish)
    const t = window.setTimeout(finish, 1000)
    return () => window.clearTimeout(t)
  }, [])
  return ready
}
