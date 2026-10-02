import { ChevronDown, Copy, Eye, EyeOff, MoreHorizontal, Trash2 } from 'lucide-react';
import { memo, useState } from 'react';
import { getSectionDefinition, type Section } from '@resumeforge/core';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { IconButton } from '../../../components/ui/IconButton';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '../../../components/ui/Menu';
import { cn } from '../../../lib/cn';
import { MOD_LABEL } from '../../../lib/platform';
import { duplicateSection, removeSection, updateSection } from '../../../state/editorActions';
import { useEditorStore } from '../../../state/editorStore';
import { DragHandle, type DragHandleProps } from '../fields/SortableList';
import { sectionHasContent } from './content';
import { SectionBody } from './SectionBody';
import { SECTION_ICONS } from './sectionIcons';
import { useSidebarStore } from './sidebarStore';

export const SectionCard = memo(function SectionCard({
  section,
  handle,
  dragging,
}: {
  section: Section;
  handle: DragHandleProps;
  dragging: boolean;
}) {
  const open = useSidebarStore((s) => Boolean(s.openSections[section.id]));
  const toggle = useSidebarStore((s) => s.toggleSection);
  const selected = useEditorStore((s) => s.selection.kind === 'section' && s.selection.sectionId === section.id);
  const [confirming, setConfirming] = useState(false);
  const def = getSectionDefinition(section.type);
  const Icon = SECTION_ICONS[def.icon];
  const title = section.title || def.label;
  const count = section.type === 'summary' ? null : section.entries.length;

  const select = () => useEditorStore.getState().select({ kind: 'section', sectionId: section.id });

  return (
    <div
      data-editor-section={section.id}
      className={cn(
        'border-b border-line bg-surface',
        selected && 'shadow-[inset_2px_0_0_var(--ui-accent)]',
        dragging && 'relative z-10 shadow-pop',
      )}
    >
      <div className={cn('group flex items-center gap-1.5 py-2 pr-2 pl-1.5', !section.visible && 'text-muted')}>
        <DragHandle handle={handle} label={`Reorder section ${title}`} />
        <Icon className="size-4 shrink-0 text-muted" aria-hidden />
        <button
          type="button"
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-baseline gap-2 rounded py-0.5 text-left"
          onClick={() => {
            toggle(section.id);
            select();
          }}
        >
          <span className={cn('truncate text-sm font-semibold', section.visible ? 'text-ink' : 'text-muted line-through decoration-1')}>
            {title}
          </span>
          {count !== null && <span className="tabular shrink-0 text-xs text-muted">{count}</span>}
        </button>
        <IconButton
          label={section.visible ? `Hide ${title} from resume` : `Show ${title} on resume`}
          onClick={() => updateSection(section.id, { visible: !section.visible })}
          active={!section.visible}
        >
          {section.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </IconButton>
        <Menu>
          <MenuTrigger asChild>
            <IconButton label={`More actions for ${title}`} noTooltip>
              <MoreHorizontal className="size-4" />
            </IconButton>
          </MenuTrigger>
          <MenuContent>
            <MenuItem icon={<Copy className="size-4" />} onSelect={() => duplicateSection(section.id)}>
              Duplicate section
            </MenuItem>
            <MenuItem
              icon={section.visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              onSelect={() => updateSection(section.id, { visible: !section.visible })}
            >
              {section.visible ? 'Hide from resume' : 'Show on resume'}
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              destructive
              icon={<Trash2 className="size-4" />}
              onSelect={() => (sectionHasContent(section) ? setConfirming(true) : removeSection(section.id))}
            >
              Delete section
            </MenuItem>
          </MenuContent>
        </Menu>
        <IconButton label={open ? `Collapse ${title}` : `Expand ${title}`} onClick={() => toggle(section.id)}>
          <ChevronDown className={cn('size-4 transition-transform duration-200', open && 'rotate-180')} />
        </IconButton>
      </div>
      {open && (
        <div className="bg-raised/60">
          <SectionBody section={section} />
        </div>
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${title}?`}
        description={`The section and everything in it will be removed. You can undo this with ${MOD_LABEL}+Z, or hide the section instead to keep its content.`}
        confirmLabel="Delete section"
        onConfirm={() => removeSection(section.id)}
      />
    </div>
  );
});
