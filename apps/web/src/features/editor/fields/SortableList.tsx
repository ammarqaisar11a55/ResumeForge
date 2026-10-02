import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';

export interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  /** Callback ref registering the handle as the drag activator. */
  activator: (element: HTMLElement | null) => void;
}

export interface SortableItemState {
  isDragging: boolean;
  handle: DragHandleProps;
}

interface SortableListProps {
  ids: string[];
  onMove: (from: number, to: number) => void;
  children: (id: string, index: number, state: SortableItemState) => ReactNode;
  className?: string;
  /** Name of the things being sorted, for screen reader announcements. */
  itemName?: string;
}

/**
 * Vertical drag-and-drop list with pointer, touch and keyboard support
 * (focus a handle, press Space, move with the arrow keys, Space to drop).
 */
export function SortableList({ ids, onMove, children, className, itemName = 'item' }: SortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from !== -1 && to !== -1) onMove(from, to);
  };

  const position = (id: string | number) => ids.indexOf(String(id)) + 1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Picked up ${itemName} ${position(active.id)} of ${ids.length}.`,
          onDragOver: ({ active, over }) =>
            over ? `${itemName} ${position(active.id)} is over position ${position(over.id)}.` : `${itemName} is no longer over a position.`,
          onDragEnd: ({ over }) =>
            over ? `Dropped ${itemName} at position ${position(over.id)} of ${ids.length}.` : `Dropped ${itemName}.`,
          onDragCancel: () => `Reordering cancelled.`,
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {ids.map((id, index) => (
            <SortableRow key={id} id={id}>
              {(state) => children(id, index, state)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: string; children: (state: SortableItemState) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isSorting } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10', isSorting && !isDragging && 'transition-transform')}
      data-dragging={isDragging || undefined}
    >
      {children({ isDragging, handle: { attributes, listeners, activator: setActivatorNodeRef } })}
    </div>
  );
}

export function DragHandle({ handle, label, className }: { handle: DragHandleProps; label: string; className?: string }) {
  const { activator, attributes, listeners } = handle;
  return (
    <button
      type="button"
      ref={activator}
      {...attributes}
      {...listeners}
      aria-label={label}
      className={cn(
        'flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-faint hover:bg-raised hover:text-ink active:cursor-grabbing',
        className,
      )}
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  );
}
