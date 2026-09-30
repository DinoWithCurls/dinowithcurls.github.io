import { createContext, useContext } from 'react'

/** Whether to skip movement: follows the OS Reduce Motion setting. */
type MotionState = { reduce: boolean }

export const MotionContext = createContext<MotionState | null>(null)

export function useMotion(): MotionState {
  const ctx = useContext(MotionContext)
  if (!ctx) throw new Error('useMotion must be used inside <MotionProvider>')
  return ctx
}
