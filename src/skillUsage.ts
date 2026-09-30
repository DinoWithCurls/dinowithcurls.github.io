import { experience, projects } from './content'

// Skill labels that are written differently from the stack labels they cover.
const ALIASES: Record<string, string[]> = {
  Python: ['Python', 'Django', 'Django REST Framework'],
  'HTML/CSS': ['HTML/CSS', 'SASS'],
  'Node.js / Express': ['Node.js', 'Express'],
  Django: ['Django', 'Django REST Framework'],
}

/** Where a skill shows up in the roles and projects on this site, e.g. "PulseGen, Workouter". */
export function usageFor(skill: string): string | undefined {
  const names = ALIASES[skill] ?? [skill]
  const uses = (stack: string[]) => stack.some((s) => names.includes(s))
  const places = [
    ...experience.filter((e) => uses(e.stack)).map((e) => e.company),
    ...projects.filter((p) => uses(p.stack)).map((p) => p.name),
  ]
  return places.length ? places.join(', ') : undefined
}
