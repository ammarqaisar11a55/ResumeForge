import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { createDemoResume, TEMPLATE_LIST, type TemplateId } from '@resumeforge/core';
import { ResumeThumbnail } from '@resumeforge/renderer';
import { GitHubMark } from '../components/GitHubMark';
import { Segmented } from '../components/ui/Segmented';
import { Reveal } from '../features/landing/Reveal';
import { ScrollProgress, WordReveal } from '../features/landing/ScrollMotion';
import { SiteFooter, SiteHeader } from '../features/landing/SiteHeader';
import { StoryScroll } from '../features/landing/StoryScroll';
import { TemplateShowcase } from '../features/landing/TemplateShowcase';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { DEVELOPER_NAME, DEVELOPER_URL, REPOSITORY_URL } from '../lib/links';

const FEATURES: { title: string; body: string }[] = [
  {
    title: 'Real pages, as you type',
    body: 'The preview is the document itself, laid out on A4 or US Letter sheets. No mock-ups, no screenshots, no surprises after export.',
  },
  {
    title: 'Page breaks with manners',
    body: 'Headings never sit alone at the bottom of a page. Entries move together, and long ones break between bullet points, never mid-line.',
  },
  {
    title: 'Structure you can rearrange',
    body: 'Drag sections, entries, contact details and bullets into order. Hide a section without deleting it. Add your own sections.',
  },
  {
    title: 'A PDF that matches the preview',
    body: 'Exports are rendered from the same pages you see, with selectable text, embedded fonts and working links.',
  },
  {
    title: 'Readable by people and parsers',
    body: 'Three templates built on plain, semantic text: no skill bars, no text in images, a predictable reading order for applicant tracking systems.',
  },
  {
    title: 'Saved without thinking about it',
    body: 'Every change saves automatically. Undo and redo understand actions like “Delete project”, not just keystrokes.',
  },
];

const STEPS: { title: string; body: string }[] = [
  {
    title: 'Fill in your sections',
    body: 'Education, experience, projects, skills and achievements each have their own fields. Add as many entries as you need.',
  },
  {
    title: 'Shape the page',
    body: 'Pick a template, then adjust type, spacing, margins and colour within limits that keep the page readable.',
  },
  {
    title: 'Download the PDF',
    body: 'Export a print-ready PDF or print directly. Keep several versions for different roles.',
  },
];

/** Hero copy drifts up and fades as the hero scrolls away (parallax against the sheets). */
function HeroCopy({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -70]);
  const opacity = useTransform(scrollY, [0, 420], [1, 0.25]);
  return <motion.div style={reduce ? undefined : { y, opacity }}>{children}</motion.div>;
}

function HeroDocument() {
  const [template, setTemplate] = useState<TemplateId>('classic');
  const resumes = useMemo(
    () => Object.fromEntries(TEMPLATE_LIST.map((t) => [t.id, createDemoResume(t.id)])) as Record<TemplateId, ReturnType<typeof createDemoResume>>,
    [],
  );
  const wide = useMediaQuery('(min-width: 640px)');
  const width = wide ? 440 : 300;
  const reduce = useReducedMotion();
  // Parallax: the sheets fan apart as the hero scrolls away.
  const { scrollY } = useScroll();
  const backX = useTransform(scrollY, [0, 600], [0, 26]);
  const backY = useTransform(scrollY, [0, 600], [0, 34]);
  const backRotate = useTransform(scrollY, [0, 600], [0, 4]);
  const frontY = useTransform(scrollY, [0, 600], [0, -40]);
  const frontRotate = useTransform(scrollY, [0, 600], [0, -1.5]);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative" style={{ width }}>
        {/* The second sheet behind hints that documents run to several pages. */}
        <motion.div
          className="absolute inset-0 translate-x-5 translate-y-4 rotate-[2.5deg] bg-white shadow-page"
          style={reduce ? undefined : { x: backX, y: backY, rotate: backRotate }}
          aria-hidden
        />
        <div className="relative animate-rise">
          <motion.div
            className="shadow-page"
            style={{ height: width * (297 / 210), ...(reduce ? {} : { y: frontY, rotate: frontRotate }) }}
          >
            <ResumeThumbnail resume={resumes[template]} width={width} />
          </motion.div>
        </div>
      </div>
      <Segmented
        label="Preview template"
        value={template}
        onChange={setTemplate}
        className="w-full max-w-xs bg-surface"
        options={TEMPLATE_LIST.map((t) => ({ value: t.id, label: t.name.replace('Forge ', '') }))}
      />
    </div>
  );
}

/** A small diagram of the page-break rule, drawn with real type. */
function BreakSpecimen() {
  return (
    <figure className="rounded-[10px] border border-line bg-canvas p-6" aria-labelledby="break-caption">
      <div className="mx-auto flex max-w-sm flex-col gap-3">
        <div className="bg-white px-5 pt-4 pb-3 text-[#1a1a1a] shadow-page">
          <div className="mb-2 h-1.5 w-3/4 rounded-sm bg-[#d4d4d4]" />
          <div className="mb-2 h-1.5 w-11/12 rounded-sm bg-[#d4d4d4]" />
          <div className="h-1.5 w-2/3 rounded-sm bg-[#d4d4d4]" />
          <div className="specimen-ghost mt-3 border-t-[1.5px] border-[#1a1a1a] pt-1.5 text-[9px] font-bold tracking-[0.13em] text-[#b4231b]">
            PROJECTS
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-dashed border-[#c9c9c9] pt-2 text-[10px] text-[#8a8a8a]">
            <span>End of page 1</span>
            <span>space left unused</span>
          </div>
        </div>
        <div className="bg-white px-5 pt-4 pb-4 text-[#1a1a1a] shadow-page">
          <div className="specimen-moved border-t-[1.5px] border-[#1a1a1a] pt-1.5 text-[9px] font-bold tracking-[0.13em] text-[#b4231b]">
            PROJECTS
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] font-semibold">
            <span>Quillmark</span>
            <span className="text-[9px]">GitHub · quillmark</span>
          </div>
          <div className="mt-1.5 h-1.5 w-11/12 rounded-sm bg-[#d4d4d4]" />
          <div className="mt-1.5 h-1.5 w-4/5 rounded-sm bg-[#d4d4d4]" />
        </div>
      </div>
      <figcaption id="break-caption" className="mt-5 text-center text-sm text-muted">
        The heading moved to page 2 with its first project instead of being stranded.
      </figcaption>
    </figure>
  );
}

export function LandingPage() {
  useEffect(() => {
    document.title = 'ResumeForge — Build a resume worth remembering';
  }, []);

  return (
    <div className="min-h-dvh bg-surface">
      <ScrollProgress />
      <div className="relative overflow-hidden bg-canvas">
        <SiteHeader />
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-16 lg:pb-28">
          <HeroCopy>
            <h1 className="type-display text-[clamp(2.6rem,7vw,4.6rem)] text-ink">Build a resume worth remembering.</h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted">
              ResumeForge is a resume editor that works like a document tool. Fill in structured sections and watch real
              pages lay themselves out, page breaks and all. What you see is the PDF you send.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/app?new"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-[15px] font-semibold text-on-primary hover:opacity-90"
              >
                Create resume
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                to="/templates"
                className="inline-flex h-12 items-center rounded-md border border-line-strong bg-surface px-6 text-[15px] font-semibold text-ink hover:bg-raised"
              >
                View templates
              </Link>
            </div>
            <p className="mt-5 text-sm text-faint">Free to use. No account needed: your resumes stay in your browser.</p>
          </HeroCopy>
          <HeroDocument />
        </section>
      </div>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-24 sm:px-6">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Reveal>
              <h2 className="type-title max-w-md text-[2rem] leading-tight text-ink">
                The layout work a word processor leaves to you, handled.
              </h2>
            </Reveal>
            <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={(i % 2) * 90 + Math.floor(i / 2) * 60}>
                  <dt className="font-semibold text-ink">{f.title}</dt>
                  <dd className="mt-1.5 text-[15px] leading-relaxed text-muted">{f.body}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
          <Reveal className="lg:sticky lg:top-10 lg:self-start lg:pt-16" delay={150}>
            <BreakSpecimen />
          </Reveal>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-8 border-y border-line bg-raised">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal>
            <h2 className="type-title text-[2rem] text-ink">How it works</h2>
          </Reveal>
          <StoryScroll steps={STEPS} />
        </div>
      </section>

      <section id="templates" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-24 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="type-title max-w-lg text-[2rem] leading-tight text-ink">Three templates, one set of content</h2>
          <p className="max-w-sm text-[15px] text-muted">Switch at any time. Your content never changes, only how it is set.</p>
        </Reveal>
        <div className="mt-12">
          <TemplateShowcase width={280} />
        </div>
      </section>

      <section className="border-t border-line">
        <Reveal className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="type-title text-2xl text-ink">Open source, built in the open</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
              ResumeForge is a React and TypeScript monorepo with a shared rendering engine, an Express and PostgreSQL API
              and headless Chrome PDF export. Read the code, file an issue or run it yourself.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end md:justify-center">
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2.5 rounded-md border border-line-strong bg-surface px-4 text-[15px] font-semibold text-ink hover:bg-raised"
            >
              <GitHubMark className="size-[18px]" />
              ammarqaisar11a55/ResumeForge
              <ArrowUpRight className="size-4 text-muted" aria-hidden />
            </a>
            <a
              href={DEVELOPER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
            >
              Designed and built by <span className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4">{DEVELOPER_NAME}</span>
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          </div>
        </Reveal>
      </section>

      <section className="bg-ink text-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between">
          <WordReveal text="Your next resume starts on page one." className="type-display text-[clamp(2rem,4vw,3rem)]" />
          <Link
            to="/app?new"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-md bg-accent px-6 text-[15px] font-semibold text-on-accent hover:brightness-105"
          >
            Create resume
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
