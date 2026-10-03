import { Plus, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { Bullet } from '@resumeforge/core';
import { Button } from '../../../components/ui/Button';
import { IconButton } from '../../../components/ui/IconButton';
import { addBullet, moveBullet, removeBullet, updateBullet } from '../../../state/editorActions';
import { RichTextArea } from './RichTextArea';
import { DragHandle, SortableList } from './SortableList';

export interface BulletsFieldProps {
  label: string;
  sectionId: string;
  entryId: string;
  field: string;
  bullets: Bullet[];
}

/**
 * Bullet point editor. Enter adds a bullet below, Backspace on an empty
 * bullet removes it, and bullets reorder by drag or keyboard. There is no
 * limit on the number of bullets.
 */
export function BulletsField({ label, sectionId, entryId, field, bullets }: BulletsFieldProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const focusId = useRef<string | null>(null);

  useEffect(() => {
    if (!focusId.current) return;
    const el = listRef.current?.querySelector<HTMLTextAreaElement>(
      `[data-bullet-id="${focusId.current}"]`,
    );
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      focusId.current = null;
    }
  });

  return (
    <div className="flex flex-col gap-1.5" ref={listRef}>
      <span className="text-[13px] font-medium text-ink" id={`${entryId}-${field}-label`}>
        {label}
      </span>
      <SortableList
        ids={bullets.map((b) => b.id)}
        onMove={(from, to) => moveBullet(sectionId, entryId, field, from, to)}
        className="flex flex-col gap-1.5"
        itemName="bullet point"
      >
        {(id, index, { handle, isDragging }) => {
          const bullet = bullets[index]!;
          return (
            <div
              className={
                isDragging
                  ? 'flex items-start gap-1 rounded-md bg-surface shadow-pop'
                  : 'flex items-start gap-1'
              }
            >
              <DragHandle
                handle={handle}
                label={`Reorder bullet ${index + 1}`}
                className="mt-1.5"
              />
              <div className="min-w-0 flex-1">
                <RichTextArea
                  data-bullet-id={id}
                  aria-label={`${label}: bullet ${index + 1}`}
                  toolbar={false}
                  rows={1}
                  value={bullet.text}
                  placeholder="Start with a strong verb and a concrete result"
                  onChange={(text) => updateBullet(sectionId, entryId, field, id, text)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      focusId.current = addBullet(sectionId, entryId, field, index);
                    } else if (e.key === 'Backspace' && bullet.text === '' && bullets.length > 0) {
                      e.preventDefault();
                      focusId.current = bullets[index - 1]?.id ?? bullets[index + 1]?.id ?? null;
                      removeBullet(sectionId, entryId, field, id);
                    }
                  }}
                />
              </div>
              <IconButton
                label={`Delete bullet ${index + 1}`}
                size="sm"
                className="mt-1"
                onClick={() => removeBullet(sectionId, entryId, field, id)}
              >
                <X className="size-4" />
              </IconButton>
            </div>
          );
        }}
      </SortableList>
      <Button
        variant="ghost"
        size="sm"
        className="self-start text-muted"
        icon={<Plus className="size-4" />}
        onClick={() => {
          focusId.current = addBullet(sectionId, entryId, field);
        }}
      >
        Add bullet point
      </Button>
    </div>
  );
}
