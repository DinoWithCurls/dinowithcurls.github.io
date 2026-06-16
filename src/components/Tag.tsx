import {
  siCursor,
  siDatagrip,
  siDjango,
  siDocker,
  siExpress,
  siGit,
  siHtml5,
  siJavascript,
  siMongodb,
  siNextdotjs,
  siNodedotjs,
  siPhp,
  siPostgresql,
  siPycharm,
  siPython,
  siReact,
  siReactquery,
  siRedux,
  siSass,
  siShadcnui,
  siTypescript,
  siVite,
  type SimpleIcon,
} from 'simple-icons'

// Map a tech label (as written in content.ts) to a monochrome brand glyph.
// Labels with no entry simply render as text — that's intentional and fine.
const ICONS: Record<string, SimpleIcon> = {
  React: siReact,
  'React Native': siReact,
  TypeScript: siTypescript,
  JavaScript: siJavascript,
  Python: siPython,
  MongoDB: siMongodb,
  'Node.js': siNodedotjs,
  'Node.js / Express': siNodedotjs,
  Express: siExpress,
  'Next.js': siNextdotjs,
  Vite: siVite,
  Django: siDjango,
  'Django REST Framework': siDjango,
  'TanStack Query': siReactquery,
  ShadCN: siShadcnui,
  Git: siGit,
  Docker: siDocker,
  PyCharm: siPycharm,
  DataGrip: siDatagrip,
  Cursor: siCursor,
  'RTK Query': siRedux,
  SASS: siSass,
  PHP: siPhp,
  'HTML/CSS': siHtml5,
  'SQL (MySQL, Postgres)': siPostgresql,
}

export function Tag({ name }: { name: string }) {
  const icon = ICONS[name]
  return (
    <span className="tag">
      {icon && (
        <svg className="tag__icon" viewBox="0 0 24 24" aria-hidden role="img" fill="currentColor">
          <path d={icon.path} />
        </svg>
      )}
      {name}
    </span>
  )
}
