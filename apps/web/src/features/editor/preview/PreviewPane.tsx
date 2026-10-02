import { AlertTriangle, Minus, Plus, Scan } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { clamp, pageSizeMm, resolveSettings } from '@resumeforge/core';
import { mmToPx, ResumeDocument, type LayoutInfo } from '@resumeforge/renderer';
import { IconButton } from '../../../components/ui/IconButton';
import { cn } from '../../../lib/cn';
import { pluralize } from '../../../lib/format';
import { useEditorStore } from '../../../state/editorStore';
import { useUiStore } from '../../../state/uiStore';
import { useSidebarStore } from '../sidebar/sidebarStore';

const ZOOM_STEPS = [0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5];
const DESK_PADDING = 56;

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * The live document on the desk. Renders the real resume DOM through the
 * shared renderer; clicking any block selects it for editing.
 */
export const PreviewPane = forwardRef<HTMLDivElement, { interactive?: boolean }>(function PreviewPane(
  { interactive = true },
  documentRef,
) {
  const resume = useEditorStore((s) => s.resume);
  const selection = useEditorStore((s) => s.selection);
  const pageCount = useEditorStore((s) => s.pageCount);
  const overflow = useEditorStore((s) => s.overflow);
  const zoom = useUiStore((s) => s.zoom);
  const setZoom = useUiStore((s) => s.setZoom);
  const cropMarks = useUiStore((s) => s.cropMarks);
  const [deskRef, deskWidth] = useElementWidth<HTMLDivElement>();
  const docWrapperRef = useRef<HTMLDivElement>(null);

  const onLayout = useCallback((info: LayoutInfo) => useEditorStore.getState().setLayout(info), []);

  const settings = resume ? resolveSettings(resume.template, resume.settings) : null;
  const pageWidthPx = settings ? mmToPx(pageSizeMm(settings).width) : 794;
  const fitScale = deskWidth > 0 ? clamp((deskWidth - DESK_PADDING) / pageWidthPx, 0.3, 1.25) : 1;
  const scale = zoom === 'fit' ? fitScale : zoom;

  // Highlight the selected element in the document.
  useEffect(() => {
    const root = docWrapperRef.current;
    if (!root) return;
    root.querySelectorAll('[data-selected]').forEach((el) => el.removeAttribute('data-selected'));
    let selector: string | null = null;
    if (selection.kind === 'header') selector = '.rf-page [data-section-id="__header"].rf-header';
    else if (selection.kind === 'section') {
      selector = selection.entryId
        ? `.rf-page [data-entry-id="${selection.entryId}"]:not(.rf-block)`
        : `.rf-page section[data-section-id="${selection.sectionId}"]`;
    }
    if (selector) root.querySelectorAll(selector).forEach((el) => el.setAttribute('data-selected', ''));
  });

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const target = event.target as HTMLElement;
    if (target.closest('a')) event.preventDefault();
    const sectionEl = target.closest<HTMLElement>('[data-section-id]');
    if (!sectionEl) return;
    const sectionId = sectionEl.dataset.sectionId!;
    const entryId = target.closest<HTMLElement>('[data-entry-id]')?.dataset.entryId;
    const editor = useEditorStore.getState();
    if (sectionId === '__header') editor.select({ kind: 'header' });
    else editor.select({ kind: 'section', sectionId, entryId });
    useSidebarStore.getState().reveal(sectionId, entryId);
    // On phones and tablets the form lives in another tab: take the user there.
    if (!window.matchMedia('(min-width: 1024px)').matches) useUiStore.getState().setMobileTab('edit');
  };

  const stepZoom = (direction: 1 | -1) => {
    const current = scale;
    const next =
      direction === 1 ? ZOOM_STEPS.find((z) => z > current + 0.001) : [...ZOOM_STEPS].reverse().find((z) => z < current - 0.001);
    if (next) setZoom(next);
  };

  if (!resume) return null;

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-canvas">
      {overflow && (
        <div role="status" className="flex items-center gap-2 border-b border-line bg-danger-soft px-4 py-2 text-xs text-danger">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          Some content is taller than a whole page and is cut off. Break long paragraphs into bullet points.
        </div>
      )}
      <div
        ref={deskRef}
        className="min-h-0 flex-1 overflow-auto overscroll-contain"
        data-testid="preview-desk"
        aria-label="Resume preview"
        role="region"
      >
        <div className="flex min-w-fit justify-center px-7 pt-9 pb-24">
          <div
            ref={docWrapperRef}
            style={{ zoom: scale }}
            className={cn('rf-preview', cropMarks && 'rf-preview--marks', interactive && 'rf-preview--interactive')}
            onClick={onClick}
          >
            <ResumeDocument ref={documentRef} resume={resume} onLayout={onLayout} />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute right-0 bottom-4 left-0 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-line bg-surface/95 p-1 shadow-pop backdrop-blur">
          <span className="tabular px-2 text-xs text-muted" aria-live="polite">
            {pluralize(pageCount, 'page')} · {settings?.page.format}
          </span>
          <span className="h-4 w-px bg-line" aria-hidden />
          <IconButton label="Zoom out" size="sm" onClick={() => stepZoom(-1)} tooltipSide="top">
            <Minus className="size-4" />
          </IconButton>
          <button
            type="button"
            className="tabular h-7 w-12 rounded-md text-xs font-medium text-ink hover:bg-raised"
            onClick={() => setZoom(1)}
            aria-label="Reset zoom to 100%"
          >
            {Math.round(scale * 100)}%
          </button>
          <IconButton label="Zoom in" size="sm" onClick={() => stepZoom(1)} tooltipSide="top">
            <Plus className="size-4" />
          </IconButton>
          <IconButton label="Fit to width" size="sm" active={zoom === 'fit'} onClick={() => setZoom('fit')} tooltipSide="top">
            <Scan className="size-4" />
          </IconButton>
        </div>
      </div>
    </div>
  );
});
