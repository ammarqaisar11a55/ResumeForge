import { BarChart3, Plus, Type } from 'lucide-react';
import {
  getSectionDefinition,
  issuesFor,
  type AchievementEntry,
  type AnyEntry,
  type Section,
} from '@resumeforge/core';
import { Button } from '../../../components/ui/Button';
import { Field } from '../../../components/ui/Field';
import { Segmented } from '../../../components/ui/Segmented';
import { TextInput } from '../../../components/ui/TextInput';
import { addEntry, moveEntry, updateEntry, updateSection } from '../../../state/editorActions';
import { SortableList } from '../fields/SortableList';
import { useIssues } from '../issuesContext';
import { EntryCard } from './EntryCard';
import { useSidebarStore } from './sidebarStore';
import { SummaryEditor } from './SummaryEditor';

export function SectionBody({ section }: { section: Section }) {
  const issues = useIssues();
  const def = getSectionDefinition(section.type);
  const entries = section.entries as AnyEntry[];

  const add = (init?: Record<string, unknown>) => {
    const id = addEntry(section.id, init);
    if (id) useSidebarStore.getState().toggleEntry(id, true);
  };

  return (
    <div className="flex flex-col gap-3 px-3 pt-1 pb-4">
      <Field label="Heading">
        {({ id }) => (
          <TextInput
            id={id}
            value={section.title}
            placeholder={def.defaultTitle}
            onChange={(e) => updateSection(section.id, { title: e.target.value })}
          />
        )}
      </Field>

      {section.type === 'summary' ? (
        <SummaryEditor section={section} />
      ) : (
        <>
          {entries.length === 0 && (
            <p className="rounded-md border border-dashed border-line-strong px-3 py-3 text-xs leading-relaxed text-muted">
              Nothing here yet. Add your first {def.entryNoun} below. Empty sections are left out of
              the resume.
            </p>
          )}
          <SortableList
            ids={entries.map((e) => e.id)}
            onMove={(from, to) => moveEntry(section.id, from, to)}
            className="flex flex-col gap-1.5"
            itemName={def.entryNoun}
          >
            {(id, index, { handle, isDragging }) => {
              const entry = entries[index]!;
              return (
                <EntryCard
                  sectionId={section.id}
                  sectionType={section.type}
                  entry={entry}
                  index={index}
                  handle={handle}
                  dragging={isDragging}
                  issues={issuesFor(issues, id)}
                  noun={def.entryNoun}
                  header={
                    section.type === 'achievements' ? (
                      <Segmented
                        label="Achievement style"
                        value={(entry as AchievementEntry).kind}
                        onChange={(kind) => updateEntry(section.id, id, 'kind', kind)}
                        options={[
                          { value: 'stat', label: 'Figure card' },
                          { value: 'text', label: 'Text' },
                        ]}
                      />
                    ) : undefined
                  }
                />
              );
            }}
          </SortableList>
          {section.type === 'achievements' ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                icon={<BarChart3 className="size-4" />}
                onClick={() => add({ kind: 'stat' })}
              >
                Add figure
              </Button>
              <Button
                size="sm"
                icon={<Type className="size-4" />}
                onClick={() => add({ kind: 'text' })}
              >
                Add text
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="self-start"
              icon={<Plus className="size-4" />}
              onClick={() => add()}
            >
              Add {def.entryNoun}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
