import TerminalHome from './terminal/TerminalHome'
import { MotionProvider } from './motion/MotionProvider'

export default function App() {
  return (
    <MotionProvider>
      <TerminalHome />
    </MotionProvider>
  )
}
