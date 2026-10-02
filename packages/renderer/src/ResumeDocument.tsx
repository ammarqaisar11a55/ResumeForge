import {
  forwardRef,
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { resolveSettings, type Resume, type SectionType } from '@resumeforge/core';
import { buildBlocks } from './blocks/buildBlocks';
import type { DocBlock, FragmentRange } from './blocks/types';
import { documentClassName, documentStyle, pageMetrics, pageStyle } from './layout';
import { BLOCK_ATTR, measureBlocks } from './pagination/measure';
import { layoutSignature, paginate, type PageLayout } from './pagination/paginate';

export interface LayoutInfo {
  pageCount: number;
  overflow: boolean;
}

export interface ResumeDocumentProps {
  resume: Resume;
  /** Render only the first N pages (thumbnails). Pagination still covers the whole document. */
  maxPages?: number;
  /** Called after every layout change. */
  onLayout?: (info: LayoutInfo) => void;
  className?: string;
}

/** Re-render when web fonts finish loading so measurements use real glyph metrics. */
function useFontsVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    if (!fonts) return;
    let alive = true;
    const bump = () => alive && setVersion((v) => v + 1);
    fonts.addEventListener?.('loadingdone', bump);
    void fonts.ready.then(bump);
    return () => {
      alive = false;
      fonts.removeEventListener?.('loadingdone', bump);
    };
  }, []);
  return version;
}

const noopSubscribe = () => () => {};

/** The measuring layer is portalled to <body>; that only exists on the client. */
function usePortalTarget(): HTMLElement | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => document.body,
    () => null,
  );
}

interface PlacedBlock {
  block: DocBlock;
  range: FragmentRange;
  firstOnPage: boolean;
}

/** Render blocks, grouping consecutive blocks of a section in one <section>. */
function BlockList({
  items,
  sectionTypes,
  measuring,
}: {
  items: PlacedBlock[];
  sectionTypes: Map<string, SectionType>;
  measuring: boolean;
}) {
  const groups: { sectionId: string | null; items: PlacedBlock[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.sectionId === item.block.sectionId && item.block.sectionId !== null) last.items.push(item);
    else groups.push({ sectionId: item.block.sectionId, items: [item] });
  }

  const renderBlock = ({ block, range, firstOnPage }: PlacedBlock) => (
    <div
      key={`${block.key}:${range.from}`}
      className={`rf-block rf-block--${block.kind}`}
      {...{ [BLOCK_ATTR]: block.key }}
      data-section-id={block.sectionId ?? '__header'}
      data-entry-id={block.entryId}
      style={{ paddingTop: measuring || firstOnPage ? 0 : block.spaceBefore }}
    >
      {block.render(range)}
    </div>
  );

  return groups.map((group, i) => {
    if (group.sectionId === null) return group.items.map(renderBlock);
    const type = sectionTypes.get(group.sectionId) ?? 'custom';
    return (
      <section key={`${group.sectionId}:${i}`} className={`rf-section rf-section--${type}`} data-section-id={group.sectionId}>
        {group.items.map(renderBlock)}
      </section>
    );
  });
}

/**
 * The paginated resume. Blocks are first rendered whole in an invisible,
 * untransformed measuring layer; the measured heights are paginated and the
 * visible pages render exactly the fragments the paginator chose. Because
 * both layers share the same markup and CSS, the pages match measurement,
 * and because each page is a fixed-size box, print and PDF output match the
 * preview page for page.
 */
export const ResumeDocument = memo(
  forwardRef<HTMLDivElement, ResumeDocumentProps>(function ResumeDocument(
    { resume, maxPages, onLayout, className },
    ref,
  ) {
    const settings = useMemo(() => resolveSettings(resume.template, resume.settings), [resume.template, resume.settings]);
    const blocks = useMemo(() => buildBlocks(resume, { settings }), [resume, settings]);
    const metrics = useMemo(() => pageMetrics(settings), [settings]);
    const sectionTypes = useMemo(() => new Map(resume.sections.map((s) => [s.id, s.type])), [resume.sections]);
    const fontsVersion = useFontsVersion();

    const measureRef = useRef<HTMLDivElement>(null);
    const [layout, setLayout] = useState<PageLayout[] | null>(null);
    const portalTarget = usePortalTarget();

    useLayoutEffect(() => {
      const root = measureRef.current;
      if (!root) return;
      const measured = measureBlocks(root, blocks);
      const pages = paginate(measured, metrics.contentHeightPx);
      setLayout((prev) => (prev && layoutSignature(prev) === layoutSignature(pages) ? prev : pages));
    }, [blocks, metrics.contentHeightPx, fontsVersion, portalTarget]);

    const pages = useMemo(() => {
      const byKey = new Map(blocks.map((b) => [b.key, b]));
      // Before the first measurement (or without a DOM), show everything on one page.
      const source: PageLayout[] = layout ?? [
        {
          used: 0,
          overflow: false,
          fragments: blocks.map((b, i) => ({ key: b.key, from: 0, to: b.atomCount, continued: false, firstOnPage: i === 0 })),
        },
      ];
      return source.map((page) => ({
        overflow: page.overflow,
        items: page.fragments.flatMap((f): PlacedBlock[] => {
          const block = byKey.get(f.key);
          // Blocks can vanish between an edit and the next measurement.
          if (!block) return [];
          const to = Math.min(f.to, block.atomCount);
          if (to <= f.from) return [];
          return [{ block, range: { from: f.from, to, continued: f.continued }, firstOnPage: f.firstOnPage }];
        }),
      }));
    }, [layout, blocks]);

    const pageCount = pages.length;
    const overflow = pages.some((p) => p.overflow);
    useEffect(() => {
      onLayout?.({ pageCount, overflow });
    }, [onLayout, pageCount, overflow]);

    const docClass = documentClassName(resume.template, settings);
    const docStyle = documentStyle(settings);
    const showNumbers = settings.page.pageNumbers && pageCount > 1;
    const visiblePages = maxPages ? pages.slice(0, maxPages) : pages;

    const measureLayer: ReactNode = (
      <div className="rf-measure" aria-hidden="true">
        <div className={docClass} style={docStyle}>
          <div className="rf-page-content" ref={measureRef} style={{ width: metrics.contentWidthPx }}>
            <BlockList
              measuring
              sectionTypes={sectionTypes}
              items={blocks.map((block) => ({
                block,
                range: { from: 0, to: block.atomCount, continued: false },
                firstOnPage: false,
              }))}
            />
          </div>
        </div>
      </div>
    );

    return (
      <>
        <div
          ref={ref}
          className={className ? `${docClass} ${className}` : docClass}
          style={docStyle}
          data-page-count={pageCount}
          lang="en"
        >
          {visiblePages.map((page, i) => (
            <div
              key={i}
              className="rf-page"
              data-page={i + 1}
              data-overflow={page.overflow ? '' : undefined}
              style={pageStyle(metrics)}
            >
              <div className="rf-page-content">
                <BlockList items={page.items} sectionTypes={sectionTypes} measuring={false} />
              </div>
              {showNumbers && (
                <div className="rf-page-number" aria-hidden="true">
                  Page {i + 1} of {pageCount}
                </div>
              )}
            </div>
          ))}
        </div>
        {portalTarget ? createPortal(measureLayer, portalTarget) : null}
      </>
    );
  }),
);
