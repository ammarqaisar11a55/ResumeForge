import { useEffect, useMemo, useRef, useState } from 'react';
import type { Resume } from '@resumeforge/core';
import { ResumeThumbnail } from '@resumeforge/renderer';
import { Skeleton } from '../../components/ui/Skeleton';
import { resumeService } from '../../services';

/** Renders a real first-page thumbnail once the card scrolls into view. */
export function LazyThumbnail({ id, updatedAt, width }: { id: string; updatedAt: string; width: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  const resume = useMemo<Resume | null>(() => {
    if (!visible) return null;
    try {
      return resumeService.local.get(id)?.resume ?? null;
    } catch {
      return null;
    }
    // updatedAt invalidates the cached document after edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, updatedAt, visible]);

  const height = width * (297 / 210);
  return (
    <div ref={ref} style={{ width, minHeight: height }}>
      {resume ? <ResumeThumbnail resume={resume} width={width} /> : <Skeleton className="rounded-none" />}
    </div>
  );
}
