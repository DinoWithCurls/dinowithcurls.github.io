// The status bar across the top, like waybar: the focused window's title, the time in
// Hyderabad, and links.
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { profile } from '../content'
import { DownloadIcon, GithubIcon, LinkedinIcon, MailIcon } from '../components/icons'
import { EASE } from '../motion/boot'
import { useMotion } from '../motion/context'

function useClock() {
  const fmt = () =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date())
  const [now, setNow] = useState(fmt)
  useEffect(() => {
    const id = window.setInterval(() => setNow(fmt()), 15000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

export function Bar({ title, show }: { title: string; show: boolean }) {
  const { reduce } = useMotion()
  const clock = useClock()
  return (
    <motion.header
      className="tbar"
      initial={reduce ? false : { opacity: 0, y: -12 }}
      animate={show ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <span className="tbar__host">
        <span className="tbar__title">{title}</span>
      </span>
      <span className="tbar__clock">Hyderabad · {clock} IST</span>
      <nav className="tbar__links" aria-label="Links">
        <span className="tbar__keys" aria-hidden>
          drag a title to move · drag a gap to resize
        </span>
        <a href={profile.resume} target="_blank" rel="noreferrer">
          <DownloadIcon className="" /> cv
        </a>
        <a href={profile.github} target="_blank" rel="noreferrer">
          <GithubIcon /> github
        </a>
        <a href={profile.linkedin} target="_blank" rel="noreferrer">
          <LinkedinIcon /> linkedin
        </a>
        <a href={`mailto:${profile.email}`}>
          <MailIcon className="" /> email
        </a>
      </nav>
    </motion.header>
  )
}
