// Single source of copy for the site. Kept in sync with ~/Documents/career/cv.md.
// Public framing rules: plain product words (roadmaps, backlogs,
// feedback insights), "customers" (never tenant/user counts); integrations = frontend only;
// Copilot = frontend only. Kanban virtualisation is claimable (confirmed 2026-09-29).

export const profile = {
  name: 'Aditya Raj Singh',
  location: 'Hyderabad, India',
  email: 'adityarajsingh64@gmail.com',
  github: 'https://github.com/DinoWithCurls',
  linkedin: 'https://www.linkedin.com/in/adityarsingh-314159/',
  resume: '/Aditya_Raj_Singh.pdf',
}

export const about: string[] = [
  'I’m a full-stack engineer with about four years of experience, most recently at PulseGen and before that at Holidify.',
  'Most of my work has been product features people use every day, and making them hold up: fast when the data gets big, strict about who can see what, and still working when a request fails or a stream breaks.',
]

/** The hero's one line under the name. It doesn't list features; `built` does that. */
export const heroLine = 'Full-stack engineer · ~4 years · Hyderabad, India'

/** The few things worth asking about, shown as `cat built.md` and in the About window. */
export const built: { key: string; where: string; short: string; long: string; open: string }[] = [
  {
    key: 'copilot',
    where: 'PulseGen',
    short: 'streaming chat for the AI Copilot',
    long: 'The frontend of PulseGen’s AI Copilot: a streaming chat that recovers from broken or interrupted streams, never sends twice on retry, and only shows citations the viewer is allowed to see.',
    open: 'role:PulseGen',
  },
  {
    key: 'cmd+k',
    where: 'PulseGen',
    short: 'one search across the whole product',
    long: 'Global search in a Cmd+K palette across work items, insights, tickets and customers, scoped to what each person can access, with relevance ranking.',
    open: 'role:PulseGen',
  },
  {
    key: 'kanban',
    where: 'PulseGen',
    short: 'large boards, drag from ~7 to 60fps',
    long: 'Rebuilt the kanban board with virtualised rendering, so dragging on large boards went from about 7 to 60fps.',
    open: 'role:PulseGen',
  },
  {
    key: 'workouter',
    where: 'side project',
    short: 'an LLM agent that plans gym workouts',
    long: 'A Go backend where an LLM agent plans each gym day, and a validator rejects any plan that breaks training or injury rules before it is saved.',
    open: 'project:Workouter',
  },
]

/** The skills, grouped the way a fastfetch readout would list them. Labels match stack names. */
export const toolGroups: { key: string; tools: string[] }[] = [
  { key: 'languages', tools: ['TypeScript', 'JavaScript', 'Go', 'Python', 'HTML/CSS'] },
  { key: 'frontend', tools: ['React', 'React Native', 'Next.js', 'Zustand', 'TanStack Query', 'ShadCN'] },
  { key: 'backend', tools: ['Node.js / Express', 'Django'] },
  { key: 'data', tools: ['PostgreSQL', 'MySQL', 'MongoDB'] },
  { key: 'devops', tools: ['Docker', 'GitHub Actions', 'Git'] },
  { key: 'ai tools', tools: ['Claude Code', 'Cursor', 'Antigravity'] },
]

type Experience = {
  role: string
  company: string
  period: string
  location: string
  points: string[]
  stack: string[]
}

export const experience: Experience[] = [
  {
    role: 'Senior Full Stack Engineer',
    company: 'PulseGen',
    period: 'Dec 2025 – Sep 2026',
    location: 'Hyderabad, India',
    points: [
      'Shipped core product surfaces end to end - roadmaps and backlogs, a survey builder, feedback insights and onboarding tours - and built the frontend of the AI Copilot.',
      'Built the Copilot’s streaming chat: parsing the streamed response, recovering from malformed or interrupted streams, telling timeouts apart from errors, preventing duplicate sends on retry, and showing citations that respect each viewer’s access.',
      'Redesigned the search API’s indexing and queries for fuzzy and exact matching, bringing response times from 30+ seconds to under one.',
      'Built global search end to end: a Cmd+K palette across work items, insights, tickets and customers, with per-entity access scoping and Atlas Search relevance ranking.',
      'Cut roadmap and backlog API response times from 40–50 seconds to under five by trimming payloads.',
      'Rebuilt the kanban board with virtualised rendering and drag-and-drop that stays fast as boards grow, taking drag on large boards from ~7 to 60fps.',
      'Built the notifications engine end to end - in-app and email, with cron-batched digests and subscription handling.',
      'Built the portal’s embeddable widget flow and passwordless magic-link login, and patched an XSS vulnerability in rendered content.',
      'Onboarded and mentored a new full-stack hire through codebase walkthroughs, PR reviews and task breakdowns.',
    ],
    stack: ['React', 'TypeScript', 'Zustand', 'TanStack Query', 'ShadCN', 'Node.js', 'MongoDB'],
  },
  {
    role: 'Full Stack Engineer',
    company: 'Holidify',
    period: 'Dec 2022 – Sep 2025',
    location: 'Bengaluru, India',
    points: [
      'Built a B2B marketplace used by 1,200+ concurrent travel agents, and migrated the dashboard end to end into a new stack.',
      'Brought dashboard load times from 5 seconds down to 0.7, while tightening up security.',
      'Built the enrollment and retention flows that onboarded 1,500+ new agents.',
    ],
    stack: ['Django', 'Django REST Framework', 'React Native', 'JavaScript', 'SASS', 'PHP', 'MySQL'],
  },
  {
    role: 'Full Stack Developer Intern',
    company: 'Inkers Tech',
    period: 'Nov 2022 – Dec 2022',
    location: 'Bengaluru, India',
    points: [
      'Built reusable UI components used across the application.',
      'Migrated legacy APIs and added new ones with RTK Query.',
    ],
    stack: ['React', 'RTK Query'],
  },
  {
    role: 'Programmer Analyst Intern',
    company: 'Cognizant',
    period: 'Jan 2022 – Jun 2022',
    location: 'Kolkata, India',
    points: [
      'Trained in PL/SQL, JavaScript and Unix shell scripting; built minor data-migration projects with Informatica PowerCenter.',
    ],
    stack: ['PL/SQL', 'JavaScript', 'Informatica'],
  },
]

type Education = {
  school: string
  degree: string
  period: string
  location: string
}

export const education: Education[] = [
  {
    school: 'RCC Institute of Information Technology',
    degree: 'BTech, Computer Science & Engineering',
    period: 'Aug 2018 – Jun 2022',
    location: 'Kolkata, India',
  },
]

/** One real agent run, replayed by the Workouter window (src/components/WorkouterDemo.tsx). */
export type AgentRun = {
  title: string
  model: string
  /** Groq's per-request gate: prompt tokens plus the reserved output must fit under this */
  budget: number
  turns: { prompt: number; reserved: number; total: number; call: string }[]
  /** what the validator sent back after the first attempt */
  warning: string
  /** the accepted day: exercise, sets, reps, kg */
  plan: [string, number, string, number][]
}

type Project = {
  name: string
  stack: string[]
  period: string
  blurb: string
  points: string[]
  link?: { label: string; href: string }
  /** A real agent run, replayed in the project's window (see WorkouterDemo). */
  run?: AgentRun
  /** One line under the project's name in its window: what it does, for someone who won't click. */
  short: string
}

export const projects: Project[] = [
  {
    name: 'Workouter',
    short:
      'Plans gym workouts with an LLM agent: a Go backend picks each day’s exercises, sets and weights, and rejects any plan that breaks training or injury rules.',
    stack: ['React Native', 'Expo', 'TypeScript', 'Go', 'PostgreSQL', 'Docker', 'GitHub Actions', 'Groq'],
    period: 'Jul 2026 – Present',
    blurb:
      'A gym-training system in two parts, being wired together: a Go backend where an LLM agent plans each training day, and an Android app for logging every set.',
    points: [
      'Expo Android app that works without a signal in the gym, with sets pre-filled from the plan so logging a set takes one tap.',
      'Go and Postgres backend where an LLM agent plans each day through tool calls, with every plan checked against training rules before it is saved.',
      'Plans scored against real training weeks, with every request kept within Groq’s 8k-token limit.',
    ],
    // Day 1 of a real agent run (workouter-api/runs/20260929-131627-agent-w5-d1-2-3-4-5-6.json):
    // token counts are Groq's own, the calls and the plan are what the agent submitted.
    run: {
      title: 'real run · week 5 · day 1 · push',
      model: 'gpt-oss-120b',
      budget: 8000,
      turns: [
        {
          prompt: 4566,
          reserved: 2500,
          total: 5589,
          call: 'dumbbell_bench_press, barbell_overhead_press, incline_chest_press, …',
        },
        {
          prompt: 4824,
          reserved: 2500,
          total: 5136,
          call: 'seated_chest_press, dumbbell_bench_press, barbell_overhead_press, …',
        },
      ],
      warning: 'seated_chest_press has opened every push day for 2 weeks; open the day with it',
      plan: [
        ['seated chest press', 3, '10-12', 20],
        ['dumbbell bench press', 3, '12-15', 2.5],
        ['barbell overhead press', 3, '8-10', 5],
        ['lateral raise', 3, '12-15', 5],
        ['front raise', 3, '12-15', 2.5],
      ],
    },
  },
  {
    name: 'TypeDuel',
    short: 'Real-time typing races against a live opponent or a ghost.',
    stack: ['TypeScript', 'HTML/CSS', 'Node.js', 'WebSockets'],
    period: 'May – Jun 2026',
    blurb: 'A real-time competitive typing game, built in a strict MVC pattern with no frameworks.',
    points: [
      'Race a live opponent over WebSockets (create or join a room), or a difficulty-scaled ghost in single player.',
      'Live WPM, accuracy and error tracking, with match history and a rematch flow.',
      'Passages fetched server-side from the Wikipedia REST API with a local fallback; client on Vercel, WebSocket server on Render.',
    ],
    link: { label: 'type-duel-lovat.vercel.app', href: 'https://type-duel-lovat.vercel.app/' },
  },
  {
    name: 'Rore',
    short: 'An AI agent that tailors onboarding plans to each new hire.',
    stack: ['Next.js', 'ShadCN', 'OpenAI'],
    period: 'Dec 2024 – Mar 2025',
    blurb: 'An AI agent that tailors employee onboarding plans to each new hire.',
    points: [
      'Generates onboarding plans from individual information - setup, training and knowledge transfer.',
      'Standardises and improves the onboarding experience across a team.',
    ],
  },
]

/** One line for "outside work" in the About window. */
export const outsideWork = 'Manga and anime, multiplayer games with friends, and keeping an eye on new web frameworks.'
