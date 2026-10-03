import type { Section } from '@resumeforge/core';
import { useEditorStore } from '../../../state/editorStore';
import { moveSection } from '../../../state/editorActions';
import { SortableList } from '../fields/SortableList';
import { AddSectionMenu } from './AddSectionMenu';
import { PersonalInfoCard } from './PersonalInfoCard';
import { SectionCard } from './SectionCard';
import { IssueSummary } from './IssueSummary';

// A stable fallback: a fresh [] per read would make the store subscription loop forever.
const NO_SECTIONS: Section[] = [];

/** Left panel: the document outline. Sections reorder by drag or keyboard. */
export function SectionsPanel() {
  const sections = useEditorStore((s) => s.resume?.sections ?? NO_SECTIONS);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-line px-3">
        <h2 className="text-sm font-semibold text-ink">Sections</h2>
        <AddSectionMenu />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-testid="sections-panel">
        <PersonalInfoCard />
        <SortableList ids={sections.map((s) => s.id)} onMove={moveSection} itemName="section">
          {(id, index, { handle, isDragging }) => (
            <SectionCard section={sections[index]!} handle={handle} dragging={isDragging} />
          )}
        </SortableList>
        {sections.length === 0 && (
          <p className="px-4 py-6 text-sm text-muted">Your resume has no sections yet. Use Add section to start.</p>
        )}
      </div>
      <IssueSummary />
    </div>
  );
}
