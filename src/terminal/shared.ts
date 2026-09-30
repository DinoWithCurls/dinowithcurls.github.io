// Small values shared by the terminal desktop's parts.
import { EASE } from '../motion/boot'

export const RADIUS = 10
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

/** How a window flies to a new slot after a swap or a drop. */
export const FLIGHT = { duration: 0.42, ease: EASE }
/** How the floating window grows out of, and shrinks back into, what was clicked. */
export const FLOAT = { duration: 0.4, ease: EASE }
