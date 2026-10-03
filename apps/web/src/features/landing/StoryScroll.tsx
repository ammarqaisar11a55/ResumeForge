import { FileDown } from 'lucide-react';
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { createDemoResume, TEMPLATE_LIST, TEMPLATES, type TemplateId } from '@resumeforge/core';
import { ResumeThumbnail } from '@resumeforge/renderer';
import { cn } from '../../lib/cn';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { Reveal } from './Reveal';

export interface Step {
  title: string;
  body: string;
}

const TEMPLATE_ORDER: TemplateId[] = TEMPLATE_LIST.map((t) => t.id);

/**
 * "How it works" as a pinned scroll story: while the section is pinned, the
 * page on the right fills in its sections, changes template, then becomes a
 * PDF. Falls back to a static list on small screens and for reduced motion.
 */
export function StoryScroll({ steps }: { steps: Step[] }) {
  const wide = useMediaQuery('(min-width: 1024px)');
  const reduce = useReducedMotion();
  if (!wide || reduce) return <StaticSteps steps={steps} />;
  return <PinnedStory steps={steps} />;
}

function StaticSteps({ steps }: { steps: Step[] }) {
  return (
    <ol className="mt-10 grid gap-10 md:grid-cols-3">
      {steps.map((step, i) => (
        <li key={step.title}>
          <Reveal variant="draw" delay={i * 160} className="h-0.5 bg-ink" />
          <Reveal delay={i * 160 + 120} className="pt-5">
            <span className="type-display text-4xl text-accent-ink tabular">{i + 1}</span>
            <h3 className="mt-3 text-lg font-semibold text-ink">{step.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.body}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

function PinnedStory({ steps }: { steps: Step[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const demo = useMemo(() => createDemoResume('classic'), []);
  const [frame, setFrame] = useState({ step: 0, sections: 1, template: 'classic' as TemplateId });

  // Map continuous scroll progress to a few discrete document states.
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const step = Math.min(steps.length - 1, Math.floor(p * steps.length));
    const local = p * steps.length - step;
    const sections =
      step === 0 ? Math.max(1, Math.ceil(local * demo.sections.length)) : demo.sections.length;
    // Step 2 cycles through the templates; the export step returns to Classic.
    const template = step === 1 ? TEMPLATE_ORDER[Math.min(2, Math.floor(local * 3))]! : 'classic';
    setFrame((prev) =>
      prev.step === step && prev.sections === sections && prev.template === template
        ? prev
        : { step, sections, template },
    );
  });

  const resume = useMemo(
    () => ({ ...demo, template: frame.template, sections: demo.sections.slice(0, frame.sections) }),
    [demo, frame.sections, frame.template],
  );

  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const pageScale = useTransform(scrollYProgress, [0.66, 0.85], [1, 0.84]);
  const pageRotate = useTransform(scrollYProgress, [0.66, 0.85], [0, -3]);
  const fileOpacity = useTransform(scrollYProgress, [0.72, 0.84], [0, 1]);
  const fileY = useTransform(scrollYProgress, [0.72, 0.84], [24, 0]);

  return (
    <div ref={ref} className="relative mt-4" style={{ height: `${steps.length * 90}vh` }}>
      <div className="sticky top-0 grid h-dvh grid-cols-[1fr_1.1fr] items-center gap-16">
        <div className="relative flex gap-6">
          <div className="relative w-0.5 shrink-0 bg-line" aria-hidden>
            <motion.div
              className="absolute inset-0 origin-top bg-ink"
              style={{ scaleY: railScale }}
            />
          </div>
          <ol className="flex flex-col gap-10">
            {steps.map((step, i) => {
              const active = i === frame.step;
              return (
                <li
                  key={step.title}
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'transition-opacity duration-300',
                    active ? 'opacity-100' : 'opacity-35',
                  )}
                >
                  <span className="type-display text-4xl text-accent-ink tabular">{i + 1}</span>
                  <h3 className="mt-2 text-xl font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
                    {step.body}
                  </p>
                  {i === 1 && active && (
                    <p className="mt-3 text-sm font-semibold text-ink" aria-live="polite">
                      Now showing {TEMPLATES[frame.template].name}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="relative flex justify-center">
          <motion.div style={{ scale: pageScale, rotate: pageRotate }} className="shadow-page">
            <div style={{ height: 380 * (297 / 210), overflow: 'hidden', background: '#fff' }}>
              <ResumeThumbnail resume={resume} width={380} />
            </div>
          </motion.div>
          <motion.div
            style={{ opacity: fileOpacity, y: fileY }}
            className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-pop"
          >
            <span className="flex size-9 items-center justify-center rounded-md bg-accent text-on-accent">
              <FileDown className="size-5" aria-hidden />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-ink">Alex-Morgan-Resume.pdf</span>
              <span className="text-xs text-muted">A4, selectable text, working links</span>
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
