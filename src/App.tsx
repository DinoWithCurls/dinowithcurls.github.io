import { useEffect } from 'react'
import DeckApp from './variants/DeckApp'

export default function App() {
  // The deck owns its own scroll container, so the page body must not scroll.
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return <DeckApp />
}
