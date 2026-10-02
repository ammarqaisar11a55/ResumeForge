import { Check } from 'lucide-react';
import { fontStack, TEMPLATE_LIST, type TemplateId } from '@resumeforge/core';
import { cn } from '../../../lib/cn';
import { setTemplate } from '../../../state/editorActions';

/**
 * Template choice as type specimens rather than screenshots: each option is
 * drawn in the template's own fonts, heading treatment and accent colour.
 */
export function TemplatePicker({ value }: { value: TemplateId }) {
  return (
    <div role="radiogroup" aria-label="Template" className="flex flex-col gap-2">
      {TEMPLATE_LIST.map((template) => {
        const selected = template.id === value;
        const d = template.defaults;
        return (
          <button
            key={template.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => !selected && setTemplate(template.id)}
            className={cn(
              'flex items-stretch gap-3 rounded-md border p-2 text-left transition-colors duration-150',
              selected ? 'border-accent bg-accent-soft/50' : 'border-line hover:border-line-strong hover:bg-raised',
            )}
          >
            <TemplateSpecimen id={template.id} accent={d.colors.accent} divider={d.colors.divider} font={fontStack(d.typography.headingFont)} />
            <span className="flex min-w-0 flex-1 flex-col justify-center">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                {template.name}
                {selected && <Check className="size-3.5 text-accent-ink" aria-hidden />}
              </span>
              <span className="text-xs leading-snug text-muted">{template.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TemplateSpecimen({ id, accent, divider, font }: { id: TemplateId; accent: string; divider: string; font: string }) {
  return (
    <span
      aria-hidden
      className="flex w-16 shrink-0 flex-col gap-1 rounded-sm bg-white px-1.5 py-1.5 shadow-[0_0_0_1px_rgb(0_0_0/0.08)]"
      style={{ fontFamily: font }}
    >
      <span
        className={cn('text-[11px] leading-none font-bold text-[#1a1a1a]', id === 'minimal' && 'text-center font-semibold')}
      >
        Aa
      </span>
      <span
        className="mt-0.5 text-[5px] leading-none font-bold tracking-wider uppercase"
        style={{
          color: id === 'minimal' ? '#111' : accent,
          borderTop: id === 'classic' ? `1px solid ${divider}` : undefined,
          borderBottom: id === 'modern' ? `0.5px solid ${divider}` : undefined,
          paddingTop: id === 'classic' ? 2 : 0,
          paddingBottom: id === 'modern' ? 1 : 0,
          textTransform: id === 'modern' ? 'none' : 'uppercase',
          fontVariant: id === 'minimal' ? 'small-caps' : undefined,
        }}
      >
        {id === 'modern' ? 'Experience' : 'EXPERIENCE'}
      </span>
      <span className="h-[2px] w-full rounded-full bg-[#c9c9c9]" />
      <span className="h-[2px] w-4/5 rounded-full bg-[#c9c9c9]" />
      <span className="h-[2px] w-11/12 rounded-full bg-[#c9c9c9]" />
    </span>
  );
}
