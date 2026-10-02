import { ArrowUpRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';
import { createDemoResume, TEMPLATE_LIST } from '@resumeforge/core';
import { ResumeThumbnail } from '@resumeforge/renderer';
import { Reveal } from './Reveal';

/** The three templates rendered live from the same example resume. */
export function TemplateShowcase({ width = 300 }: { width?: number }) {
  const resumes = useMemo(() => TEMPLATE_LIST.map((t) => createDemoResume(t.id)), []);
  return (
    <ul className="grid gap-x-8 gap-y-14 md:grid-cols-3">
      {TEMPLATE_LIST.map((template, i) => (
        <Reveal as="li" key={template.id} className="flex flex-col" delay={i * 140}>
          <div className="flex justify-center rounded-md bg-canvas px-6 pt-8 pb-0">
            <div className="overflow-hidden shadow-page" style={{ maxHeight: width * 1.05 }}>
              <ResumeThumbnail resume={resumes[i]!} width={width} />
            </div>
          </div>
          <h3 className="type-title mt-5 text-xl text-ink">{template.name}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{template.description}</p>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-ink">
            {template.highlights.map((h) => (
              <li key={h} className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-accent" aria-hidden />
                {h}
              </li>
            ))}
          </ul>
          <Link
            to={`/app?new&template=${template.id}`}
            className="mt-5 inline-flex items-center gap-1 self-start rounded text-sm font-semibold text-accent-ink hover:underline"
          >
            Start with {template.name}
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}
