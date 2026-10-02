import { memo } from 'react';
import {
  entryFields,
  issuesFor,
  type AnyEntry,
  type Bullet,
  type DateRange,
  type FieldDef,
  type Section,
  type SectionType,
  type ValidationIssue,
} from '@resumeforge/core';
import { Field } from '../../../components/ui/Field';
import { Select } from '../../../components/ui/Select';
import { TextInput } from '../../../components/ui/TextInput';
import { cn } from '../../../lib/cn';
import { updateEntry } from '../../../state/editorActions';
import { BulletsField } from './BulletsField';
import { DateField, DateRangeField } from './DateFields';
import { issuesKey } from './issuesKey';
import { RichTextArea } from './RichTextArea';
import { TagsField } from './TagsField';
import { UrlInput } from './UrlInput';

interface EntryFormProps {
  sectionId: string;
  sectionType: SectionType;
  entry: AnyEntry;
  /** Issues for this entry only. */
  issues: ValidationIssue[];
}

/**
 * Form generated from the section registry's field definitions. Re-renders
 * only when its own entry or its own validation messages change.
 */
export const EntryForm = memo(
  function EntryForm({ sectionId, sectionType, entry, issues }: EntryFormProps) {
  const fields = entryFields({ type: sectionType } as Section, entry);
  const record = entry as unknown as Record<string, unknown>;
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
      {fields.map((field) => (
        <div key={field.key} className={cn(field.span === 2 || field.kind === 'bullets' ? 'col-span-2' : 'col-span-2 sm:col-span-1')}>
          <FieldControl
            field={field}
            value={record[field.key]}
            sectionId={sectionId}
            entryId={entry.id}
            issues={issuesFor(issues, entry.id, field.key)}
          />
        </div>
      ))}
    </div>
  );
  },
  (a, b) =>
    a.entry === b.entry && a.sectionId === b.sectionId && a.sectionType === b.sectionType && issuesKey(a.issues) === issuesKey(b.issues),
);

function FieldControl({
  field,
  value,
  sectionId,
  entryId,
  issues,
}: {
  field: FieldDef;
  value: unknown;
  sectionId: string;
  entryId: string;
  issues: ValidationIssue[];
}) {
  const set = (next: unknown) => updateEntry(sectionId, entryId, field.key, next);
  switch (field.kind) {
    case 'bullets':
      return <BulletsField label={field.label} sectionId={sectionId} entryId={entryId} field={field.key} bullets={value as Bullet[]} />;
    case 'tags':
      return <TagsField label={field.label} value={value as string[]} onChange={set} placeholder={field.placeholder} />;
    case 'date-range':
      return (
        <DateRangeField
          label={field.label}
          value={value as DateRange}
          onChange={set}
          currentLabel={field.currentLabel}
          issues={issues}
        />
      );
    case 'date':
      return <DateField label={field.label} value={value as string} onChange={set} issues={issues} />;
    default:
      return (
        <Field label={field.label} hint={field.hint} issues={issues}>
          {({ id, describedBy, invalid }) => {
            const text = (value as string) ?? '';
            if (field.kind === 'textarea') {
              return (
                <RichTextArea
                  id={id}
                  value={text}
                  onChange={set}
                  placeholder={field.placeholder}
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                />
              );
            }
            if (field.kind === 'url') {
              return <UrlInput id={id} value={text} onChange={set} placeholder={field.placeholder} describedBy={describedBy} invalid={issues.length > 0} />;
            }
            if (field.kind === 'select') {
              return <Select id={id} value={text} onChange={(e) => set(e.target.value)} options={field.choices ?? []} aria-describedby={describedBy} />;
            }
            return (
              <TextInput
                id={id}
                value={text}
                placeholder={field.placeholder}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                onChange={(e) => set(e.target.value)}
              />
            );
          }}
        </Field>
      );
  }
}
