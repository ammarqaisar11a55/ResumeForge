import { memo } from 'react';
import { pageSizeMm, resolveSettings, type Resume } from '@resumeforge/core';
import { mmToPx } from './units';
import { ResumeDocument } from './ResumeDocument';

export interface ResumeThumbnailProps {
  resume: Resume;
  /** Rendered width in CSS pixels. */
  width: number;
  className?: string;
}

/** First page of a resume, rendered with the real renderer and scaled down. */
export const ResumeThumbnail = memo(function ResumeThumbnail({
  resume,
  width,
  className,
}: ResumeThumbnailProps) {
  const settings = resolveSettings(resume.template, resume.settings);
  const page = pageSizeMm(settings);
  const pageWidthPx = mmToPx(page.width);
  const scale = width / pageWidthPx;
  return (
    <div
      className={className}
      style={{
        width,
        height: mmToPx(page.height) * scale,
        overflow: 'hidden',
        position: 'relative',
      }}
      aria-hidden="true"
      inert
    >
      <div
        style={{ width: pageWidthPx, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <ResumeDocument resume={resume} maxPages={1} />
      </div>
    </div>
  );
});
