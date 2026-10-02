import type { CSSProperties } from 'react';
import { fontStack, pageSizeMm, type DocumentSettings, type TemplateId } from '@resumeforge/core';
import { mmToPx } from './units';

export interface PageMetrics {
  widthMm: number;
  heightMm: number;
  margins: DocumentSettings['page']['margins'];
  contentWidthPx: number;
  contentHeightPx: number;
}

export function pageMetrics(settings: DocumentSettings): PageMetrics {
  const { width, height } = pageSizeMm(settings);
  const m = settings.page.margins;
  return {
    widthMm: width,
    heightMm: height,
    margins: m,
    contentWidthPx: mmToPx(width - m.left - m.right),
    // A hair of slack absorbs sub-pixel rounding between preview and print.
    contentHeightPx: mmToPx(height - m.top - m.bottom) - 1,
  };
}

export function documentClassName(template: TemplateId, settings: DocumentSettings): string {
  return `rf-document rf-tpl-${template} rf-bullets-${settings.bulletStyle}`;
}

/** CSS custom properties consumed by document.css. */
export function documentStyle(settings: DocumentSettings): CSSProperties {
  const { typography: t, colors: c, spacing: s, header: h, page } = settings;
  return {
    '--rf-font-body': fontStack(t.bodyFont),
    '--rf-font-heading': fontStack(t.headingFont),
    '--rf-size-base': `${t.baseSize}pt`,
    '--rf-size-section': `${t.sectionTitleSize}pt`,
    '--rf-size-entry': `${t.entryTitleSize}pt`,
    '--rf-size-name': `${t.nameSize}pt`,
    '--rf-weight-name': String(t.nameWeight),
    '--rf-line-height': String(t.lineHeight),
    '--rf-letter-spacing': `${t.letterSpacing}em`,
    '--rf-text': c.text,
    '--rf-secondary': c.secondary,
    '--rf-accent': c.accent,
    '--rf-divider': c.divider,
    '--rf-space-paragraph': `${s.paragraph}pt`,
    '--rf-space-header': `${s.header}pt`,
    '--rf-header-align': h.alignment,
    '--rf-header-justify': h.alignment === 'center' ? 'center' : 'flex-start',
    '--rf-margin-bottom': `${page.margins.bottom}mm`,
  } as CSSProperties;
}

export function pageStyle(metrics: PageMetrics): CSSProperties {
  const m = metrics.margins;
  return {
    width: `${metrics.widthMm}mm`,
    height: `${metrics.heightMm}mm`,
    padding: `${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm`,
  };
}
