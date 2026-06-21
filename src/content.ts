// Single source of copy for the site. Kept in sync with ~/Projects/career/cv.md.
// Public framing rules apply (see PROGRESS.md): "system of record", "survey builder",
// "feedback intelligence", "customers" (never tenant/user counts); integrations = frontend
// sync only; no kanban-virtualisation claim.

export const profile = {
  name: 'Aditya Raj Singh',
  tagline:
    'Full-stack engineer who builds web products end to end - frontend, APIs, and the data layer underneath.',
  location: 'Hyderabad, India',
  email: 'adityarajsingh64@gmail.com',
  github: 'https://github.com/DinoWithCurls',
  linkedin: 'https://www.linkedin.com/in/adityarsingh-314159/',
  resume: '/Aditya_Raj_Singh.pdf',
}

export const about: string[] = [
  'I build web products end to end - frontend, APIs, and the data layer underneath. Over the last few years I’ve owned features from first commit to production rather than working on isolated slices.',
  'Alongside shipping core product surfaces on small teams, I do the less visible work that keeps a product healthy - making slow APIs fast, building out notifications and auth, and tightening up security.',
  'I work steadily and try to leave code that holds up when you look closely - fast, secure, maintainable - over things that just demo well. I’m at my best when there’s room to keep growing technically and take on harder problems over time.',
]

export type Experience = {
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
    period: 'Dec 2025 – Present',
    location: 'Hyderabad, India',
    points: [
      'Shipped core product surfaces end to end: a system of record for backlogs and roadmaps, a survey builder with an embeddable widget flow, feedback-intelligence views, and an AI Copilot.',
      'Rebuilt the search API to bring response times from 30+ seconds to under one, and cut system-of-record API times from 40–50 seconds to under five.',
      'Built the notifications engine end to end - in-app and email, with cron-batched digests and subscription handling.',
      'Developed the frontend connection-and-sync flow for integrations with external issue trackers.',
      'Replaced password login with passwordless magic links, and patched an XSS vulnerability in rendered content.',
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
    stack: ['Django', 'Django REST Framework', 'React Native', 'JavaScript', 'SASS', 'PHP'],
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

export type Education = {
  school: string
  degree: string
  field: string
  period: string
  location: string
}

export const education: Education[] = [
  {
    school: 'RCC Institute of Information Technology',
    degree: 'BTech, Computer Science & Engineering',
    field: '',
    period: 'Aug 2018 – Jun 2022',
    location: 'Kolkata, India',
  },
]

export type Project = {
  name: string
  stack: string[]
  period: string
  blurb: string
  points: string[]
  link?: { label: string; href: string }
  placeholder?: boolean
}

export const projects: Project[] = [
  {
    name: 'TypeDuel',
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
    name: 'Video Uploader',
    stack: ['React', 'Vite', 'Node.js', 'Express', 'MongoDB'],
    period: 'Dec 2025',
    blurb: 'A full-stack video upload and streaming system with server-side processing.',
    points: [
      'FFmpeg-based server-side video processing and validation, with scalable file upload handling via Multer.',
      'Role-based access control (RBAC) to restrict actions by user role.',
      'Frontend on Vercel, backend on Render, media delivered through Cloudinary.',
    ],
    link: { label: 'vuploader.vercel.app', href: 'https://vuploader.vercel.app' },
  },
  {
    name: 'Rore',
    stack: ['Next.js', 'ShadCN', 'OpenAI'],
    period: 'Dec 2024 – Mar 2025',
    blurb: 'An AI agent that tailors employee onboarding plans to each new hire.',
    points: [
      'Generates onboarding plans from individual information - setup, training and knowledge transfer.',
      'Standardises and improves the onboarding experience across a team.',
    ],
  },
  {
    name: 'More coming',
    stack: [],
    period: '',
    blurb: 'A new project is in progress and will land here soon.',
    points: [],
    placeholder: true,
  },
]

export const skills: Record<string, string[]> = {
  Languages: ['TypeScript', 'JavaScript', 'Python', 'SQL (MySQL, Postgres)', 'MongoDB', 'HTML/CSS'],
  'Frameworks & Libraries': [
    'React',
    'React Native',
    'Next.js',
    'Vite',
    'Node.js / Express',
    'Django',
    'Zustand',
    'TanStack Query',
    'ShadCN',
  ],
  'Developer Tools': ['Git', 'Docker', 'VS Code', 'Cursor', 'PyCharm', 'DataGrip'],
}

export const interests: string[] = [
  'Manga and anime - a long-running habit.',
  'Multiplayer games with friends.',
  'Following tech reviews and keeping an eye on new web frameworks.',
]

export const sections = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'interests', label: 'Interests' },
  { id: 'contact', label: 'Contact' },
] as const
