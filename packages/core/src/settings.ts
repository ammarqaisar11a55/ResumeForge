import type { DocumentSettings, SettingsOverrides, TemplateId } from './schema';
import { TEMPLATES } from './templates';

/**
 * Bounds that keep documents readable. Inputs are clamped to these ranges
 * rather than rejected, so a stray value can never produce an unusable page.
 */
export const SETTING_LIMITS = {
  margin: { min: 6, max: 40, step: 1, unit: 'mm' },
  baseSize: { min: 8, max: 13, step: 0.25, unit: 'pt' },
  sectionTitleSize: { min: 7, max: 18, step: 0.25, unit: 'pt' },
  entryTitleSize: { min: 8, max: 16, step: 0.25, unit: 'pt' },
  nameSize: { min: 14, max: 44, step: 0.5, unit: 'pt' },
  nameWeight: { min: 400, max: 900, step: 100, unit: '' },
  lineHeight: { min: 1, max: 1.8, step: 0.05, unit: '×' },
  letterSpacing: { min: -0.03, max: 0.08, step: 0.005, unit: 'em' },
  sectionSpacing: { min: 4, max: 32, step: 1, unit: 'pt' },
  entrySpacing: { min: 0, max: 20, step: 1, unit: 'pt' },
  paragraphSpacing: { min: 0, max: 10, step: 0.5, unit: 'pt' },
  headerSpacing: { min: 2, max: 30, step: 1, unit: 'pt' },
} as const;

export type SettingLimitKey = keyof typeof SETTING_LIMITS;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function clampSetting(key: SettingLimitKey, value: number): number {
  const limit = SETTING_LIMITS[key];
  return clamp(value, limit.min, limit.max);
}

/** Page sizes in millimetres (portrait). */
export const PAGE_SIZES_MM = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
} as const;

export function pageSizeMm(settings: DocumentSettings): { width: number; height: number } {
  const size = PAGE_SIZES_MM[settings.page.format];
  return settings.page.orientation === 'landscape'
    ? { width: size.height, height: size.width }
    : { width: size.width, height: size.height };
}

/**
 * Merge a template's defaults with a resume's overrides and clamp everything
 * into readable bounds.
 */
export function resolveSettings(
  template: TemplateId,
  overrides: SettingsOverrides | undefined,
): DocumentSettings {
  const base = (TEMPLATES[template] ?? TEMPLATES.classic).defaults;
  const o = overrides ?? {};
  const merged: DocumentSettings = {
    page: {
      ...base.page,
      ...o.page,
      margins: { ...base.page.margins, ...o.page?.margins },
    },
    typography: { ...base.typography, ...o.typography },
    spacing: { ...base.spacing, ...o.spacing },
    colors: { ...base.colors, ...o.colors },
    header: { ...base.header, ...o.header },
    dateFormat: o.dateFormat ?? base.dateFormat,
    bulletStyle: o.bulletStyle ?? base.bulletStyle,
  };

  const m = merged.page.margins;
  merged.page.margins = {
    top: clampSetting('margin', m.top),
    right: clampSetting('margin', m.right),
    bottom: clampSetting('margin', m.bottom),
    left: clampSetting('margin', m.left),
  };
  const t = merged.typography;
  merged.typography = {
    ...t,
    baseSize: clampSetting('baseSize', t.baseSize),
    sectionTitleSize: clampSetting('sectionTitleSize', t.sectionTitleSize),
    entryTitleSize: clampSetting('entryTitleSize', t.entryTitleSize),
    nameSize: clampSetting('nameSize', t.nameSize),
    nameWeight: clampSetting('nameWeight', t.nameWeight),
    lineHeight: clampSetting('lineHeight', t.lineHeight),
    letterSpacing: clampSetting('letterSpacing', t.letterSpacing),
  };
  const s = merged.spacing;
  merged.spacing = {
    section: clampSetting('sectionSpacing', s.section),
    entry: clampSetting('entrySpacing', s.entry),
    paragraph: clampSetting('paragraphSpacing', s.paragraph),
    header: clampSetting('headerSpacing', s.header),
  };
  return merged;
}

/** Relative luminance contrast ratio between two hex colours (WCAG 2.x). */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const n = hex.replace('#', '');
    const channels = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
    const [r, g, bl] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
