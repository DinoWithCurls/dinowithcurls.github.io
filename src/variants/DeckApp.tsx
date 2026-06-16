import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import '../styles/deck.css'
import {
  about,
  education,
  experience,
  interests,
  profile,
  projects,
  skills,
} from '../content'
import {
  ArrowIcon,
  DownloadIcon,
  GithubIcon,
  LinkedinIcon,
  MailIcon,
} from '../components/icons'
import { Tag } from '../components/Tag'

const panels = [
  { id: 'top', label: 'Intro' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'interests', label: 'Interests' },
  { id: 'contact', label: 'Contact' },
]

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

// hero name: each word rises in on its own, slightly springier than the rest
const nameContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

const nameWord: Variants = {
  hidden: { opacity: 0, y: 34 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 26 },
  },
}

/** The hero name, revealed word by word (falls back to plain text when motion is reduced). */
function HeroName({ name }: { name: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <h1 className="deck-hero__name">{name}</h1>
  return (
    <motion.h1 className="deck-hero__name" variants={nameContainer} aria-label={name}>
      {name.split(' ').map((word, i) => (
        <motion.span className="deck-hero__word" key={`${word}-${i}`} variants={nameWord} aria-hidden>
          {word}
        </motion.span>
      ))}
    </motion.h1>
  )
}

/** A child element that fades + rises in when its panel enters view, and out on leave. */
function Item({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  )
}

/** A full-viewport panel; its children animate in on enter and out on leave. */
function Panel({
  id,
  label,
  num,
  children,
}: {
  id: string
  label?: string
  num?: string
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <section className="deck__panel" id={id}>
      <motion.div
        className="deck__inner"
        initial={reduce ? undefined : 'hidden'}
        whileInView={reduce ? undefined : 'visible'}
        viewport={{ amount: 0.4, once: false }}
        variants={container}
      >
        {label && (
          <Item>
            <p className="section__label">
              {num} / {label}
            </p>
          </Item>
        )}
        {children}
      </motion.div>
    </section>
  )
}

function DeckDots({ active, onJump }: { active: string; onJump: (id: string) => void }) {
  return (
    <nav className="deck-dots" aria-label="Sections">
      {panels.map((p) => (
        <button
          key={p.id}
          className={active === p.id ? 'is-active' : ''}
          aria-label={p.label}
          aria-current={active === p.id}
          onClick={() => onJump(p.id)}
        />
      ))}
    </nav>
  )
}

export default function DeckApp() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState('top')

  // track which panel is centred, scoped to the deck's own scroll container
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id)
        }
      },
      { root, threshold: 0.5 },
    )
    panels.forEach((p) => {
      const el = document.getElementById(p.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <DeckDots active={active} onJump={jump} />
      <div className="deck" ref={scrollRef}>
        <Panel id="top">
          <Item>
            <p className="deck-hero__eyebrow">
              Hi, my name is<span className="deck-hero__caret" aria-hidden>_</span>
            </p>
          </Item>
          <HeroName name={profile.name} />
          <Item>
            <p className="deck-hero__tagline">{profile.tagline}</p>
          </Item>
          <Item>
            <div className="hero__actions">
              <a className="btn" href={profile.resume} target="_blank" rel="noreferrer">
                <DownloadIcon className="" /> Download CV
              </a>
              <div className="socials">
                <a className="social" href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub">
                  <GithubIcon />
                </a>
                <a className="social" href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <LinkedinIcon />
                </a>
                <a className="social" href={`mailto:${profile.email}`} aria-label="Email">
                  <MailIcon />
                </a>
              </div>
            </div>
          </Item>
        </Panel>

        <Panel id="about" label="About" num="01">
          <Item>
            <h2 className="section__title">A bit about me</h2>
          </Item>
          {about.map((para) => (
            <Item key={para.slice(0, 24)}>
              <p style={{ color: 'var(--text-muted)', maxWidth: 680, marginBottom: 12 }}>{para}</p>
            </Item>
          ))}
        </Panel>

        <Panel id="experience" label="Experience" num="02">
          <Item>
            <h2 className="section__title">Where I’ve worked</h2>
          </Item>
          <div className="deck-exp">
            {experience.map((job) => (
              <Item key={job.company}>
                <div className="deck-exp__row">
                  <div className="deck-exp__period">{job.period}</div>
                  <div>
                    <h3 className="deck-exp__role">
                      {job.role} · <span>{job.company}</span>
                    </h3>
                    <p className="deck-exp__summary">{job.points[0]}</p>
                    <div className="tags">
                      {job.stack.slice(0, 6).map((s) => (
                        <Tag name={s} key={s} />
                      ))}
                    </div>
                  </div>
                </div>
              </Item>
            ))}
          </div>
        </Panel>

        <Panel id="education" label="Education" num="03">
          <Item>
            <h2 className="section__title">Education</h2>
          </Item>
          {education.map((ed) => (
            <Item key={ed.school}>
              <div className="edu">
                <div>
                  <h3>{ed.school}</h3>
                  <p className="edu__degree">{ed.degree}</p>
                </div>
                <span className="entry__meta">
                  {ed.period} · {ed.location}
                </span>
              </div>
            </Item>
          ))}
        </Panel>

        <Panel id="projects" label="Projects" num="04">
          <Item>
            <h2 className="section__title">Things I’ve built</h2>
          </Item>
          <div className="projects">
            {projects.map((p) => (
              <Item key={p.name}>
                <article className={`card${p.placeholder ? ' card--placeholder' : ''}`}>
                  <div className="card__head">
                    <h3 className="card__name">{p.name}</h3>
                    {p.period && <span className="card__period">{p.period}</span>}
                  </div>
                  <p className="card__blurb">{p.blurb}</p>
                  {p.stack.length > 0 && (
                    <div className="tags">
                      {p.stack.map((s) => (
                        <Tag name={s} key={s} />
                      ))}
                    </div>
                  )}
                  {p.link && (
                    <a className="card__link" href={p.link.href} target="_blank" rel="noreferrer">
                      {p.link.label} <ArrowIcon className="" />
                    </a>
                  )}
                </article>
              </Item>
            ))}
          </div>
        </Panel>

        <Panel id="skills" label="Skills" num="05">
          <Item>
            <h2 className="section__title">Tools I reach for</h2>
          </Item>
          <div className="skills">
            {Object.entries(skills).map(([group, items]) => (
              <Item className="skills__group" key={group}>
                <h3>{group}</h3>
                <div className="tags">
                  {items.map((s) => (
                    <Tag name={s} key={s} />
                  ))}
                </div>
              </Item>
            ))}
          </div>
        </Panel>

        <Panel id="interests" label="Interests" num="06">
          <Item>
            <h2 className="section__title">Outside of work</h2>
          </Item>
          <div className="deck-interests">
            {interests.map((it) => (
              <Item key={it.slice(0, 20)}>{it}</Item>
            ))}
          </div>
        </Panel>

        <Panel id="contact" label="Contact" num="07">
          <Item>
            <h2 className="contact__title" style={{ textAlign: 'left' }}>
              Let’s talk
            </h2>
          </Item>
          <Item>
            <p style={{ color: 'var(--text-muted)', maxWidth: 480, marginBottom: 26 }}>
              I’m open to mid-level full-stack roles where there’s room to keep growing. The
              fastest way to reach me is email.
            </p>
          </Item>
          <Item>
            <a className="btn" href={`mailto:${profile.email}`}>
              <MailIcon className="" /> {profile.email}
            </a>
          </Item>
        </Panel>
      </div>
    </>
  )
}
