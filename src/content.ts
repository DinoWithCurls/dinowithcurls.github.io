// Single source of copy for the site. Facts match ~/Documents/career/cv.md, but the site keeps
// more detail than the one-page CV (the PulseGen role in particular).
// Public framing rules: plain product words (roadmaps, backlogs,
// feedback insights), "customers" (never tenant/user counts); integrations = frontend only;
// Copilot = frontend only; notifications = his parts only (a multi-dev project).
// Kanban virtualisation is claimable (confirmed 2026-09-29).

export const profile = {
  name: 'Aditya Raj Singh',
  location: 'Hyderabad, India',
  email: 'adityarajsingh64@gmail.com',
  github: 'https://github.com/DinoWithCurls',
  linkedin: 'https://www.linkedin.com/in/adityarsingh-314159/',
  resume: '/Aditya_Raj_Singh.pdf',
}

export const about: string[] = [
  'I’m a full-stack engineer with 4 years of experience, most recently at PulseGen and before that at Holidify.',
  'Most of my work has been product features people use every day, and making them hold up: fast when the data gets big, strict about who can see what, and still working when a request fails or a stream breaks.',
]

/** The hero's one line under the name. It doesn't list features; `built` does that. */
export const heroLine = 'Full-stack engineer · 4 years · Hyderabad, India'

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
    long: 'Global search in a Cmd+K palette across 7 collections (work items, insights and five kinds of tickets), scoped to what each person can access, with results in under 2 seconds.',
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

/** A titled group of points in a role window; `tools` show as glyph tags under it. */
type Section = { title: string; points: string[]; tools?: string[] }

type Experience = {
  role: string
  company: string
  period: string
  location: string
  /** One paragraph on the company and the job, shown above the points. */
  intro?: string
  /** A role has either flat `points` or titled `sections`. */
  points?: string[]
  sections?: Section[]
  stack: string[]
}

export const experience: Experience[] = [
  {
    role: 'Senior Full Stack Engineer',
    company: 'PulseGen',
    period: 'Dec 2025 – Sep 2026',
    location: 'Hyderabad, India',
    intro:
      'PulseGen is a product-management platform: it gathers customer feedback, groups it into insights with AI, and helps product teams plan roadmaps and backlogs. I reported to the CTO and worked across the React frontend, the Node services, and the shared library that holds the data models and access rules.',
    sections: [
      {
        title: 'ai copilot',
        points: [
          'Owned the frontend of the AI Copilot, a streaming chat over the product’s data. The AI services behind it were another team’s.',
          'Parsed the streamed response and recovered from malformed or interrupted streams, told timeouts apart from errors, and stopped a retry from sending the same message twice.',
          'Showed citations only when the viewer can open what they point to, and added a polling fallback for long threads, thread export, and a PRD mode that draws Mermaid diagrams.',
        ],
      },
      {
        title: 'search and speed',
        points: [
          'Owned global search: a Cmd+K palette over 7 collections (work items, insights and five kinds of tickets), filtered by what each person can access, with results in under 2 seconds.',
          'Redesigned the insights search API’s indexing and queries for fuzzy and exact matching, bringing responses from 30+ seconds to under one.',
          'Cut roadmap and backlog API times from 40–50 seconds to under five by trimming what each response carries.',
          'Rebuilt the kanban board with virtualised rendering and a drag-and-drop that re-renders only the cells a drag touches, so dragging on large boards went from ~7 to 60fps.',
        ],
      },
      {
        title: 'access control',
        points: [
          'Built the module and submodule access model: shared utilities in the common library that the API and the AI team both used, view-only modes across tables, boards and modals, and checks at the query layer, not just in the UI.',
        ],
      },
      {
        title: 'integrations',
        points: [
          'Built the frontend for PulseGen’s Jira, Jira Product Discovery, Linear and Azure DevOps integrations: connecting an account, choosing what syncs, mapping fields and assignees, linking items, and pushing updates back.',
        ],
        tools: ['Jira', 'Jira Product Discovery', 'Linear', 'Azure DevOps'],
      },
      {
        title: 'product',
        points: [
          'Shipped roadmaps and backlogs, a survey builder, feedback insights and onboarding tours, all used daily by customers.',
          'Led the move from the old task modal to a full feature page, with tabs for the overview, discussions, AI output, sub-items and linked insights.',
          'Built the email digests, cron batching and subscribe flows for the notifications system, as one of the engineers on it.',
          'Set up Mixpanel event tracking across the app.',
        ],
      },
      {
        title: 'security',
        points: [
          'Built passwordless magic-link login to replace passwords, and the customer portal’s embeddable widget, which only loads on approved sites.',
          'Fixed XSS in file previews and rendered markdown, removed SVG from allowed uploads, and narrowed CORS.',
        ],
      },
      {
        title: 'team',
        points: [
          'Spent the first two months fixing bugs across the product before moving on to new features.',
          'Onboarded and mentored a new full-stack hire through codebase walkthroughs, PR reviews and task breakdowns.',
        ],
      },
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
      'A gym-training system in two parts: a Go backend where an LLM agent plans each training day, and an Android app for logging every set.',
    points: [
      'Offline Android app (Expo) that shows the week’s plan, logs a set in one tap, and syncs to the server.',
      'Go and Postgres backend where an LLM agent plans each gym day from past training, and a rule checker sends back any plan with weights the gym doesn’t have, oversized jumps, or moves an injury rules out.',
      'A typical day takes one model call of about 5.5k tokens, inside Groq’s 8k limit.',
      'An eval that measures how consistent the plans are from run to run, and how closely they match weeks actually trained.',
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
    short: 'An AI product that tailors onboarding plans to each new hire.',
    stack: ['Next.js', 'ShadCN', 'OpenAI'],
    period: 'Dec 2024 – Mar 2025',
    blurb: 'An AI product that tailors employee onboarding plans to each new hire.',
    points: [
      'Generates onboarding plans from individual information - setup, training and knowledge transfer.',
      'Standardises and improves the onboarding experience across a team.',
    ],
  },
]

/** One line for "outside work" in the About window. */
export const outsideWork = 'Manga and anime, multiplayer games with friends, and keeping an eye on new web frameworks.'
