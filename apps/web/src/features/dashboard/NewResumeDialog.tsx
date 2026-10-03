import { useState, type FormEvent } from 'react';
import { TEMPLATE_LIST, type TemplateId } from '@resumeforge/core';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Field } from '../../components/ui/Field';
import { Segmented } from '../../components/ui/Segmented';
import { TextInput } from '../../components/ui/TextInput';
import { TemplatePreview } from '../../components/TemplatePreview';
import { cn } from '../../lib/cn';

export interface NewResumeOptions {
  title: string;
  template: TemplateId;
  startFrom: 'blank' | 'demo';
}

export function NewResumeDialog({
  open,
  onOpenChange,
  onCreate,
  initialTemplate = 'classic',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (options: NewResumeOptions) => void;
  initialTemplate?: TemplateId;
}) {
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState<TemplateId>(initialTemplate);
  const [startFrom, setStartFrom] = useState<'blank' | 'demo'>('blank');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onCreate({ title: title.trim(), template, startFrom });
    setTitle('');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create a resume"
      description="You can change the template and every setting later."
      className="max-w-lg"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          label="Resume name"
          hint="Only you see this, e.g. the role or company you are applying to."
        >
          {({ id, describedBy }) => (
            <TextInput
              id={id}
              autoFocus
              value={title}
              placeholder="Backend internship applications"
              aria-describedby={describedBy}
              onChange={(e) => setTitle(e.target.value)}
            />
          )}
        </Field>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-ink">Start from</span>
          <Segmented
            label="Start from"
            value={startFrom}
            onChange={setStartFrom}
            options={[
              { value: 'blank', label: 'Blank resume' },
              { value: 'demo', label: 'Example content' },
            ]}
          />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-medium text-ink">Template</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TEMPLATE_LIST.map((t) => (
              <label
                key={t.id}
                className={cn(
                  'flex cursor-pointer flex-col gap-0.5 rounded-md border p-2 text-left transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus',
                  template === t.id
                    ? 'border-accent bg-accent-soft/50'
                    : 'border-line hover:border-line-strong',
                )}
              >
                <input
                  type="radio"
                  name="template"
                  value={t.id}
                  checked={template === t.id}
                  onChange={() => setTemplate(t.id)}
                  className="sr-only"
                />
                <TemplatePreview id={t.id} width={120} height={84} />
                <span className="mt-1 text-[13px] font-semibold text-ink">
                  {t.name.replace('Forge ', '')}
                </span>
                <span className="text-[11px] leading-snug text-muted">{t.highlights[0]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Create resume
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
