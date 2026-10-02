import { pageSizeMm, resolveSettings, type Resume } from '@resumeforge/core';

export interface DocumentSnapshot {
  html: string;
  widthMm: number;
  heightMm: number;
  pageCount: number;
  fonts: string[];
}

/**
 * Capture the rendered, paginated document exactly as previewed. Editor-only
 * attributes are stripped so the output contains nothing but the resume.
 */
export function snapshotDocument(element: HTMLElement, resume: Resume): DocumentSnapshot {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-selected]').forEach((el) => el.removeAttribute('data-selected'));
  clone.removeAttribute('id');
  const settings = resolveSettings(resume.template, resume.settings);
  const size = pageSizeMm(settings);
  return {
    html: clone.outerHTML,
    widthMm: size.width,
    heightMm: size.height,
    pageCount: clone.querySelectorAll('.rf-page').length,
    fonts: Array.from(new Set([settings.typography.bodyFont, settings.typography.headingFont])),
  };
}
