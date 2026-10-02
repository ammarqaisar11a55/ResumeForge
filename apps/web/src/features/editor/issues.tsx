import { useMemo, type ReactNode } from 'react';
import { validateResume } from '@resumeforge/core';
import { useEditorStore } from '../../state/editorStore';
import { IssuesContext } from './issuesContext';

/** Validates the open resume once per change and shares the result. */
export function IssuesProvider({ children }: { children: ReactNode }) {
  const resume = useEditorStore((s) => s.resume);
  const issues = useMemo(() => (resume ? validateResume(resume) : []), [resume]);
  return <IssuesContext.Provider value={issues}>{children}</IssuesContext.Provider>;
}
