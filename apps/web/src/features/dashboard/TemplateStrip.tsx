import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { TEMPLATE_LIST, type TemplateId } from '@resumeforge/core';
import { TemplatePreview } from '../../components/TemplatePreview';

/** Every template as a starting point, right on the dashboard. */
export function TemplateStrip({ onPick }: { onPick: (id: TemplateId) => void }) {
  return (
    <section aria-labelledby="template-strip-title" className="mt-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="template-strip-title" className="text-base font-semibold text-ink">
          Start from a template
        </h2>
        <Link
          to="/templates"
          className="inline-flex items-center gap-1 rounded text-sm text-muted hover:text-ink"
        >
          Compare all templates
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <ul className="mt-4 flex snap-x gap-3 overflow-x-auto pb-3">
        {TEMPLATE_LIST.map((template) => (
          <li key={template.id} className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => onPick(template.id)}
              className="group flex w-[132px] flex-col gap-2 rounded-md text-left"
              aria-label={`Create a resume with ${template.name}`}
              title={template.description}
            >
              <span className="rounded-md border border-line bg-canvas p-2.5 transition-colors group-hover:border-line-strong">
                <TemplatePreview
                  id={template.id}
                  width={108}
                  height={136}
                  className="transition-transform duration-200 group-hover:-translate-y-0.5"
                />
              </span>
              <span className="text-[13px] font-semibold text-ink">
                {template.name.replace('Forge ', '')}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
