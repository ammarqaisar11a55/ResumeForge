import { Check } from 'lucide-react';
import { TEMPLATE_LIST, type TemplateId } from '@resumeforge/core';
import { TemplatePreview } from '../../../components/TemplatePreview';
import { cn } from '../../../lib/cn';
import { setTemplate } from '../../../state/editorActions';

/** Template choice as real miniature pages rendered by the document engine. */
export function TemplatePicker({ value }: { value: TemplateId }) {
  return (
    <div role="radiogroup" aria-label="Template" className="grid grid-cols-2 gap-2">
      {TEMPLATE_LIST.map((template) => {
        const selected = template.id === value;
        return (
          <button
            key={template.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${template.name}: ${template.description}`}
            title={template.description}
            onClick={() => !selected && setTemplate(template.id)}
            className={cn(
              'flex flex-col gap-1.5 rounded-md border p-1.5 text-left transition-colors duration-150',
              selected
                ? 'border-accent bg-accent-soft/50'
                : 'border-line hover:border-line-strong hover:bg-raised',
            )}
          >
            <TemplatePreview id={template.id} width={120} height={104} />
            <span className="flex items-center gap-1 px-0.5 text-xs font-semibold text-ink">
              <span className="truncate">{template.name.replace('Forge ', '')}</span>
              {selected && <Check className="size-3.5 shrink-0 text-accent-ink" aria-hidden />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
