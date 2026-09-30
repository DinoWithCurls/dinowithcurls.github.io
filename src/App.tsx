import { useEffect } from 'react'
import TerminalHome from './variants/TerminalHome'
import { MotionProvider } from './motion/MotionProvider'

export default function App() {
  // The desktop owns its own scroll container, so the page body must not scroll.
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <MotionProvider>
      <TerminalHome />
    </MotionProvider>
  )
}
