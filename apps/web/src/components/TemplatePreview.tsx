import { memo } from 'react';
import { createDemoResume, TEMPLATE_LIST, type Resume, type TemplateId } from '@resumeforge/core';
import { ResumeThumbnail } from '@resumeforge/renderer';
import { cn } from '../lib/cn';

// One example resume per template, built once and shared by every preview.
let samples: Map<TemplateId, Resume> | null = null;
function sample(id: TemplateId): Resume {
  samples ??= new Map(TEMPLATE_LIST.map((t) => [t.id, createDemoResume(t.id)]));
  return samples.get(id)!;
}

/** The top of a real first page in the given template, rendered by the document engine. */
export const TemplatePreview = memo(function TemplatePreview({
  id,
  width,
  height,
  className,
}: {
  id: TemplateId;
  width: number;
  /** Visible height; the page is cropped from the top. */
  height: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'block overflow-hidden rounded-[3px] bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.08)]',
        className,
      )}
      style={{ width, height }}
      aria-hidden
    >
      <ResumeThumbnail resume={sample(id)} width={width} />
    </span>
  );
});
