import { createContext, useContext } from 'react';
import type { ValidationIssue } from '@resumeforge/core';

export const IssuesContext = createContext<ValidationIssue[]>([]);

/** Validation issues of the open resume, computed once per change by IssuesProvider. */
export function useIssues(): ValidationIssue[] {
  return useContext(IssuesContext);
}
