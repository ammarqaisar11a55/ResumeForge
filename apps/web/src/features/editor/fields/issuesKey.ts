import type { ValidationIssue } from '@resumeforge/core';

/** Stable string for comparing issue lists in memo comparators. */
export const issuesKey = (issues: ValidationIssue[]): string => issues.map((i) => `${i.field}:${i.message}`).join('|');
