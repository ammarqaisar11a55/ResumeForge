import { ChevronDown, Eye, EyeOff, Plus, Trash2, UserRound } from 'lucide-react';
import {
  CONTACT_KINDS,
  contactText,
  issuesFor,
  LINK_CONTACT_KINDS,
  PERSONAL_TARGET,
  type ContactItem,
  type ContactKind,
} from '@resumeforge/core';
import { Button } from '../../../components/ui/Button';
import { Field } from '../../../components/ui/Field';
import { IconButton } from '../../../components/ui/IconButton';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../../../components/ui/Menu';
import { Select } from '../../../components/ui/Select';
import { TextInput } from '../../../components/ui/TextInput';
import { cn } from '../../../lib/cn';
import { addContact, moveContact, removeContact, updateContact, updatePersonal } from '../../../state/editorActions';
import { useEditorStore } from '../../../state/editorStore';
import { DragHandle, SortableList } from '../fields/SortableList';
import { useIssues } from '../issuesContext';
import { CONTACT_LABELS, PLACEHOLDERS } from './contactLabels';
import { useSidebarStore } from './sidebarStore';

const INPUT_TYPES: Partial<Record<ContactKind, string>> = { email: 'email', phone: 'tel' };

export function PersonalInfoCard() {
  const personal = useEditorStore((s) => s.resume?.personalInfo);
  const selected = useEditorStore((s) => s.selection.kind === 'header');
  const open = useSidebarStore((s) => s.personalOpen);
  const setOpen = useSidebarStore((s) => s.setPersonalOpen);
  const issues = useIssues();
  if (!personal) return null;

  return (
    <div className={cn('border-b border-line', selected && 'shadow-[inset_2px_0_0_var(--ui-accent)]')} data-editor-section="__header">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex size-6 items-center justify-center text-muted" aria-hidden>
          <UserRound className="size-4" />
        </span>
        <button
          type="button"
          className="flex min-w-0 flex-1 flex-col items-start rounded text-left"
          aria-expanded={open}
          onClick={() => {
            setOpen(!open);
            useEditorStore.getState().select({ kind: 'header' });
          }}
        >
          <span className="text-sm font-semibold text-ink">Personal information</span>
          <span className="w-full truncate text-xs text-muted">{personal.fullName || 'Name, title and contact details'}</span>
        </button>
        <IconButton label={open ? 'Collapse personal information' : 'Expand personal information'} onClick={() => setOpen(!open)}>
          <ChevronDown className={cn('size-4 transition-transform duration-200', open && 'rotate-180')} />
        </IconButton>
      </div>

      {open && (
        <div className="flex flex-col gap-3.5 bg-raised/60 px-3 pt-1 pb-4">
          <Field label="Full name" issues={issuesFor(issues, PERSONAL_TARGET, 'fullName')}>
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                value={personal.fullName}
                autoComplete="name"
                placeholder="Your full name"
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                onChange={(e) => updatePersonal('fullName', e.target.value)}
              />
            )}
          </Field>
          <Field label="Professional title" hint="Shown under your name, e.g. role and school or company.">
            {({ id, describedBy }) => (
              <TextInput
                id={id}
                value={personal.headline}
                placeholder="Software Engineering Student · University Name"
                aria-describedby={describedBy}
                onChange={(e) => updatePersonal('headline', e.target.value)}
              />
            )}
          </Field>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink">Contact details</span>
              <Menu>
                <MenuTrigger asChild>
                  <Button variant="ghost" size="sm" icon={<Plus className="size-4" />}>
                    Add
                  </Button>
                </MenuTrigger>
                <MenuContent>
                  {CONTACT_KINDS.map((kind) => (
                    <MenuItem key={kind} onSelect={() => addContact(kind)}>
                      {CONTACT_LABELS[kind]}
                    </MenuItem>
                  ))}
                </MenuContent>
              </Menu>
            </div>
            {personal.contacts.length === 0 && (
              <p className="rounded-md border border-dashed border-line-strong px-3 py-2.5 text-xs text-muted">
                Add an email, phone number and the links recruiters should open.
              </p>
            )}
            <SortableList
              ids={personal.contacts.map((c) => c.id)}
              onMove={moveContact}
              className="flex flex-col gap-2"
              itemName="contact detail"
            >
              {(id, index, { handle, isDragging }) => (
                <ContactRow contact={personal.contacts[index]!} handle={handle} dragging={isDragging} />
              )}
            </SortableList>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactRow({
  contact,
  handle,
  dragging,
}: {
  contact: ContactItem;
  handle: Parameters<typeof DragHandle>[0]['handle'];
  dragging: boolean;
}) {
  const issues = useIssues();
  const issue = issuesFor(issues, contact.id, 'value')[0];
  const isLink = LINK_CONTACT_KINDS.has(contact.kind);
  const label = CONTACT_LABELS[contact.kind];
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 rounded-md border border-line bg-surface p-2',
        dragging && 'shadow-pop',
        !contact.visible && 'opacity-60',
      )}
    >
      <div className="flex items-center gap-1.5">
        <DragHandle handle={handle} label={`Reorder ${label}`} />
        <Select
          aria-label="Contact type"
          className="w-32 shrink-0"
          value={contact.kind}
          options={CONTACT_KINDS.map((k) => ({ value: k, label: CONTACT_LABELS[k] }))}
          onChange={(e) => updateContact(contact.id, { kind: e.target.value as ContactKind })}
        />
        <TextInput
          aria-label={label}
          type={INPUT_TYPES[contact.kind] ?? 'text'}
          value={contact.value}
          placeholder={PLACEHOLDERS[contact.kind]}
          spellCheck={false}
          aria-invalid={issue ? true : undefined}
          onChange={(e) => updateContact(contact.id, { value: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-1.5 pl-7">
        {isLink ? (
          <TextInput
            aria-label={`${label} display text`}
            className="h-8 text-[13px]"
            value={contact.label}
            placeholder={contact.value ? `Shown as ${contactText({ ...contact, label: '' })}` : 'Display text (optional)'}
            onChange={(e) => updateContact(contact.id, { label: e.target.value })}
          />
        ) : (
          <span className="flex-1" />
        )}
        <IconButton
          label={contact.visible ? `Hide ${label} on resume` : `Show ${label} on resume`}
          onClick={() => updateContact(contact.id, { visible: !contact.visible })}
        >
          {contact.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </IconButton>
        <IconButton label={`Remove ${label}`} onClick={() => removeContact(contact.id)}>
          <Trash2 className="size-4" />
        </IconButton>
      </div>
      {issue && <p className="pl-7 text-xs text-warning">{issue.message}</p>}
    </div>
  );
}
