# ResumeForge

**Build a resume worth remembering.**

ResumeForge is a resume builder that works like a document tool. You fill in structured sections and watch real A4 or US Letter pages lay themselves out, page breaks included. The preview is the document itself, and the PDF you download is rendered from exactly those pages.

- Live, paginated A4/Letter preview built from the real resume DOM (no screenshots)
- Pagination that keeps headings with their content and splits long entries only between bullet points
- Drag-and-drop for sections, entries, contact details and bullet points (mouse, touch and keyboard)
- Three templates: **Forge Classic**, **Forge Modern** and **Forge Minimal**. Switch at any time without losing content.
- Typography, spacing, margin, colour and page controls, clamped to readable limits
- Autosave, unload protection, and undo/redo of named actions ("Delete project")
- Server-rendered PDFs with embedded fonts, selectable text and working links, plus browser printing
- Light and dark app themes. The resume paper always stays print-white.
- Local-first storage in the browser, mirrored to PostgreSQL when the API is running

## Quick start

Requirements: **Node.js 20.12+** and **Google Chrome or Chromium** (for server-side PDF export).

```bash
npm install
```

```bash
npm run dev
```

This starts the API on `http://localhost:4000` and the web app on `http://localhost:5173`. With no database configured, the API stores data in an embedded PostgreSQL (PGlite) under `apps/server/.data`, so nothing else needs to be installed.

To use your own PostgreSQL server, copy `apps/server/.env.example` to `apps/server/.env` and set `DATABASE_URL`:

```bash
createdb resumeforge
```

```bash
DATABASE_URL=postgres://user:password@localhost:5432/resumeforge npm run db:migrate
```

The web app also runs on its own (`npm run dev:web`). Resumes are then kept in the browser, and **Download PDF** falls back to the browser's print dialog, which produces the same pages.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API and web app with hot reload |
| `npm run build` | Production build of the web app (`apps/web/dist`) and the API (`apps/server/dist`) |
| `npm test` | Unit and integration tests for every package (Vitest) |
| `npm run test:e2e` | End-to-end tests in Chrome (Playwright). Starts its own servers. |
| `npm run typecheck` | TypeScript across all workspaces |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply database migrations |

Production runs as a single process that serves the API and the built web app:

```bash
npm run build
```

```bash
WEB_DIST=../web/dist DATABASE_URL=postgres://… npm start -w @resumeforge/server
```

## Architecture

```
packages/
  core/       Resume data model (zod schemas), section registry, validation,
              settings and template defaults, migrations, demo resume
  renderer/   Document renderer shared by every output: templates, the
              block/atom model, the measuring pagination engine, document CSS,
              print document builder
apps/
  web/        React + Vite app: landing page, dashboard, editor, export
  server/     Express API: resumes, versions, export history, PDF rendering
```

### One renderer for every output

The renderer turns a resume into a flat list of **blocks** (header, section heading, entry, paragraph), each made of **atoms** (an entry head, each bullet point). Blocks render once, invisibly, to be measured. A pure paginator (`packages/renderer/src/pagination/paginate.ts`) then assigns fragments to fixed-size pages:

1. Blocks that fit are placed whole.
2. A heading is never left at the bottom of a page without the start of its content.
3. An entry that fits on the next page is moved there, unless it is large and a lot of space would be wasted. Only then is it split between bullets, keeping the entry head with at least one bullet.
4. Content taller than a page is always split between atoms. A single atom taller than a page is flagged as overflowing.

The same component renders the live preview, dashboard thumbnails, the landing page, the print view and the PDF. For PDFs the client sends the already-paginated markup. The server renders it in headless Chrome with the same CSS and font files, so each preview page becomes exactly one PDF page.

### Data model

A resume is one JSON document (`packages/core/src/schema.ts`):

```
Resume
 ├── metadata        title, cached page count, tags
 ├── personalInfo    name, professional title, ordered contact items (each can be hidden)
 ├── sections[]      ordered; each has type, title, visible, options, entries[]
 ├── template        classic | modern | minimal
 ├── settings        only the values the user changed; the rest comes from the template
 └── timestamps
```

Sections are a discriminated union (summary, education, experience, projects, skills, achievements, certifications, awards, publications, languages, interests, custom). The editor builds its forms from a declarative section registry, so adding a section type means adding a registry entry and a renderer. No database change is needed.

### Database

PostgreSQL stores each resume's document as `jsonb`, next to relational tables ready for growth: `users`, `templates`, `resumes` (soft delete), `resume_versions` (automatic snapshots at most every 10 minutes, plus labelled versions), and `export_history`. Every query is scoped to a user id. Until authentication is added, requests act as a built-in local user (`apps/server/src/http/context.ts`).

### API

| Method | Path | |
| --- | --- | --- |
| `GET` | `/api/health` | Capabilities: persistence and PDF |
| `GET` | `/api/resumes` | Summaries |
| `GET` / `PUT` / `DELETE` | `/api/resumes/:id` | Read, upsert, soft delete |
| `GET` / `POST` | `/api/resumes/:id/versions` | List or create a labelled version |
| `GET` | `/api/resumes/:id/versions/:n` | Read a version |
| `POST` | `/api/export/pdf` | Render a PDF from paginated document markup |
| `GET` | `/api/export` | Export history |

PDF rendering treats the submitted markup as untrusted: scripts and embeds are stripped, a CSP blocks script execution, every network request from the page is refused (fonts are inlined as data URIs), and each render runs in a fresh browser context.

## Keyboard shortcuts

| Action | Shortcut |
| --- | --- |
| Undo / redo | `Ctrl+Z` / `Ctrl+Shift+Z` or `Ctrl+Y` |
| Save now | `Ctrl+S` |
| Print | `Ctrl+P` |
| Download PDF | `Ctrl+Shift+E` |
| Focus preview | `Ctrl+Shift+F` |
| Toggle sections / design panel | `Ctrl+\` / `Ctrl+Shift+\` |
| Shortcut help | `?` |

On macOS use `⌘` instead of `Ctrl`.

## Configuration

Server environment variables (see `apps/server/.env.example`):

| Variable | Default | |
| --- | --- | --- |
| `PORT` | `4000` | API port |
| `DATABASE_URL` | none | PostgreSQL connection string. Unset uses embedded PGlite. |
| `DATA_DIR` | `.data` | PGlite location (`memory` for a throwaway database) |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed browser origins, comma separated |
| `CHROME_PATH` | auto-detected | Chrome or Chromium executable for PDF export |
| `CHROME_NO_SANDBOX` | `false` | Needed when running Chrome as root in some containers |
| `WEB_DIST` | none | Serve the built web app from the API process |

Web build variables: `VITE_API_URL` (default `/api`) and `VITE_ENABLE_API=false` for a fully offline build.

## Author

Designed and built by [Muhammad Ammar Qaisar](https://personal-portfolio-website-orpin-three.vercel.app/).
