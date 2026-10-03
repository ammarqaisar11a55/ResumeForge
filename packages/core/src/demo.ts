import { createId } from './ids';
import { createContact } from './operations';
import { SCHEMA_VERSION } from './schema';
import type {
  AchievementEntry,
  Bullet,
  EducationEntry,
  ProjectEntry,
  Resume,
  SectionOf,
  SkillCategory,
  TemplateId,
} from './schema';

/**
 * A realistic technical resume for a fictional student, following the
 * structure of a dense single-column engineering CV: education, grouped
 * skills, problem-solving figures, many projects and academic projects.
 */

const bullets = (...lines: string[]): Bullet[] => lines.map((text) => ({ id: createId(), text }));
const range = (start: string, end = '', current = false) => ({ start, end, current });

function education(
  degree: string,
  institution: string,
  start: string,
  end: string,
  current: boolean,
  gpa = '',
): EducationEntry {
  return {
    id: createId(),
    degree,
    institution,
    location: '',
    dates: range(start, end, current),
    gpa,
    gpaLabel: 'CGPA',
    gpaScale: '',
    description: '',
    details: [],
  };
}

function project(p: Partial<ProjectEntry> & Pick<ProjectEntry, 'name'>): ProjectEntry {
  return {
    id: createId(),
    kind: '',
    role: '',
    technologies: [],
    githubUrl: '',
    liveUrl: '',
    otherUrl: '',
    dates: range(''),
    description: '',
    bullets: [],
    ...p,
  };
}

const skill = (name: string, skills: string[]): SkillCategory => ({ id: createId(), name, skills });

const stat = (value: string, label: string): AchievementEntry => ({
  id: createId(),
  kind: 'stat',
  value,
  label,
  description: '',
  text: '',
});

export function createDemoResume(template: TemplateId = 'classic'): Resume {
  const now = new Date().toISOString();

  const educationSection: SectionOf<'education'> = {
    id: createId(),
    type: 'education',
    title: 'Education',
    visible: true,
    options: {},
    entries: [
      education(
        'Bachelor of Science in Software Engineering',
        'Northfield Institute of Technology',
        '2023',
        '',
        true,
        '3.86',
      ),
      education('Intermediate in Computer Science', 'Riverside College', '2021', '2023', false),
      education('Matriculation in Science', 'Harbour Grammar School', '2019', '2021', false),
    ],
  };

  const skillsSection: SectionOf<'skills'> = {
    id: createId(),
    type: 'skills',
    title: 'Technical Skills',
    visible: true,
    options: {},
    entries: [
      skill('Languages', [
        'C',
        'C++',
        'JavaScript',
        'TypeScript',
        'Python',
        'Kotlin',
        'Rust',
        'SQL',
      ]),
      skill('Frontend', [
        'HTML5',
        'CSS',
        'Tailwind CSS',
        'React',
        'React Router',
        'Next.js',
        'Jetpack Compose',
      ]),
      skill('Backend', ['Node.js', 'Express.js', 'REST APIs', 'JWT', 'OAuth 2.0', 'WebSockets']),
      skill('Databases', ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Redis']),
      skill('Tools', [
        'Git',
        'GitHub Actions',
        'Docker',
        'Vite',
        'Postman',
        'Vercel',
        'Figma',
        'Linux',
      ]),
    ],
  };

  const achievementsSection: SectionOf<'achievements'> = {
    id: createId(),
    type: 'achievements',
    title: 'Problem Solving',
    visible: true,
    options: { statColumns: 3 },
    entries: [
      stat('900+', 'LeetCode problems solved'),
      stat('210', 'Accepted Codeforces solutions in C++'),
      stat('Top 8%', 'ICPC Asia regional preliminary round'),
      {
        id: createId(),
        kind: 'text',
        value: '',
        label: '',
        description: '',
        text: 'Solutions are archived on GitHub by topic, covering graphs, dynamic programming, segment trees, greedy techniques, bit manipulation and system design problems.',
      },
    ],
  };

  const projectsSection: SectionOf<'projects'> = {
    id: createId(),
    type: 'projects',
    title: 'Projects',
    visible: true,
    options: {},
    entries: [
      project({
        name: 'Quillmark',
        kind: 'Desktop App',
        githubUrl: 'github.com/alexmorgan-dev/quillmark',
        technologies: [
          'Tauri 2',
          'Rust',
          'React 19',
          'TypeScript',
          'Vite',
          'Tailwind CSS 4',
          'Zustand',
          'Vitest',
        ],
        bullets: bullets(
          'Offline Markdown reader for Windows, macOS and Linux with syntax highlighting for 40+ languages, a scroll-synced outline, tabbed sessions and live reload when files change on disk.',
          'Parses CommonMark and GitHub tables in Rust and sanitises the generated HTML before display, so every opened document is treated as untrusted input.',
        ),
      }),
      project({
        name: 'Focus Shield',
        kind: 'Android App',
        githubUrl: 'github.com/alexmorgan-dev/focus-shield',
        technologies: [
          'Kotlin',
          'Jetpack Compose',
          'Material 3',
          'Room',
          'DataStore',
          'Hilt',
          'Coroutines',
          'WorkManager',
        ],
        bullets: bullets(
          'Scheduled distraction-free sessions enforced through official device-management APIs, without root access, accessibility-service workarounds or screen overlays.',
          'Every state change goes through a single idempotent reconcile step, so the device returns to the correct policy after reboots, process death or manual tampering.',
        ),
      }),
      project({
        name: 'Sheets Bridge',
        kind: 'Developer Tool',
        githubUrl: 'github.com/alexmorgan-dev/sheets-bridge',
        technologies: [
          'Node.js',
          'TypeScript',
          'Model Context Protocol',
          'Google Sheets API',
          'OAuth 2.0 PKCE',
          'Zod',
        ],
        bullets: bullets(
          'Model Context Protocol server that lets AI assistants read, query and update Google Sheets through the official API with typed, validated tool inputs.',
          'Distributed as a single-file desktop extension and as a standalone server, with PKCE sign-in, encrypted token storage and automatic refresh.',
        ),
      }),
      project({
        name: 'TestBench',
        kind: 'VS Code Extension',
        githubUrl: 'github.com/alexmorgan-dev/testbench',
        technologies: ['TypeScript', 'VS Code Extension API', 'C++', 'Node.js'],
        bullets: bullets(
          'Generates a runnable C++ harness from a competitive-programming problem page, including the exact function signature and every sample case as a test.',
          'Type-aware comparison for 64-bit integers, floating-point tolerances and unordered answers; each test runs in an isolated process with time and output limits.',
        ),
      }),
      project({
        name: 'Portscope',
        kind: 'VS Code Extension',
        githubUrl: 'github.com/alexmorgan-dev/portscope',
        technologies: ['TypeScript', 'VS Code Extension API', 'React', 'esbuild', 'Mocha'],
        bullets: bullets(
          'Shows which local servers are running, which process owns each port and which workspace started it, by reading the operating system socket table on every platform.',
          'One state manager feeds the tree view, dashboard webview and status bar; ships with zero runtime dependencies and no telemetry.',
        ),
      }),
      project({
        name: 'Clipkeeper',
        kind: 'Chrome Extension',
        githubUrl: 'github.com/alexmorgan-dev/clipkeeper',
        technologies: [
          'TypeScript',
          'React 19',
          'Manifest V3',
          'Chrome Extension APIs',
          'Vite',
          'Vitest',
          'Puppeteer',
        ],
        bullets: bullets(
          'Detects media exposed by a page and saves it through the browser download manager, with a queue that supports pause, resume, cancel and retry.',
          'Requests no host permissions by default; unit, integration and end-to-end test layers gate every CI-built release.',
        ),
      }),
      project({
        name: 'Roomly',
        kind: 'Full Stack',
        role: 'Backend lead, team of 2',
        liveUrl: 'roomly-demo.vercel.app',
        technologies: [
          'React 19',
          'Vite',
          'Tailwind CSS 4',
          'Express 5',
          'PostgreSQL',
          'Prisma',
          'Chart.js',
          'Zod',
        ],
        bullets: bullets(
          'Student housing platform: students compare and book rooms near their campus; landlords manage listings, photos and booking requests from an analytics dashboard.',
          'Designed and built the Express REST API with Prisma over PostgreSQL, image uploads to object storage and role-based access control.',
        ),
      }),
      project({
        name: 'Linkly',
        kind: 'Full Stack',
        liveUrl: 'linkly-demo.vercel.app',
        technologies: ['React 19', 'Vite', 'Express 5', 'MongoDB Atlas', 'Redis'],
        bullets: bullets(
          'Branded short links with custom aliases, one-click copy and per-redirect analytics, with hot links cached in Redis for sub-10 ms redirects.',
        ),
      }),
    ],
  };

  const academicSection: SectionOf<'projects'> = {
    id: createId(),
    type: 'projects',
    title: 'Academic Projects',
    visible: true,
    options: {},
    entries: [
      project({
        name: 'Family Lineage Database',
        kind: 'Database Systems',
        role: 'Team of 4',
        liveUrl: 'lineage-db-demo.vercel.app',
        technologies: ['Node.js', 'Express', 'MySQL', 'Recursive CTEs', 'JWT', 'bcrypt'],
        bullets: bullets(
          'Genealogy database for profiles, parent–child and spousal relationships, and life events tracked across generations.',
          'Normalised adjacency-list schema with recursive common table expressions to fetch trees of any depth in a single query.',
        ),
      }),
      project({
        name: 'Deadlock Lab',
        kind: 'Operating Systems',
        role: 'Team of 3',
        technologies: ['C++17', "Banker's Algorithm", 'Wait-For Graph', 'Graphviz'],
        bullets: bullets(
          "Three-stage deadlock pipeline: Banker's Algorithm safety checks, wait-for graph cycle detection and cost-based victim selection for recovery.",
          'Benchmarked from 5 to 50 processes; graphs export to Graphviz DOT for visual inspection.',
        ),
      }),
    ],
  };

  return {
    id: createId(),
    schemaVersion: SCHEMA_VERSION,
    metadata: { title: 'Software Engineering Internship', pageCount: 3, tags: ['demo'] },
    personalInfo: {
      fullName: 'Alex Morgan',
      headline: 'Software Engineering Student · Northfield Institute of Technology',
      contacts: [
        createContact('phone', '+1 555 0142 778'),
        createContact('location', 'Portland, Oregon'),
        createContact('email', 'alex.morgan@example.com'),
        createContact('linkedin', 'linkedin.com/in/alex-morgan-dev'),
        createContact('github', 'github.com/alexmorgan-dev'),
        createContact('leetcode', 'leetcode.com/u/alexmorgan'),
      ],
    },
    sections: [
      {
        id: createId(),
        type: 'summary',
        title: 'Summary',
        visible: true,
        options: { showTitle: false },
        entries: [
          {
            id: createId(),
            text: 'Software Engineering student (CGPA 3.86) looking for a software engineering internship. I build desktop, mobile and web tools and practise problem solving most days, with more than 900 LeetCode problems solved. My work spans Rust desktop apps, Android device-policy tooling, editor and browser extensions, and full-stack web platforms.',
          },
        ],
      },
      educationSection,
      skillsSection,
      achievementsSection,
      projectsSection,
      academicSection,
    ],
    template,
    settings: {},
    createdAt: now,
    updatedAt: now,
  };
}
