/**
 * Fonts available to resume documents. Every font is self-hosted through a
 * `@fontsource-variable/*` package so the live preview, print output and
 * server-rendered PDF all use byte-identical font files.
 */
export const FONT_IDS = [
  'archivo',
  'inter',
  'ibm-plex-sans',
  'source-sans-3',
  'roboto',
  'source-serif-4',
  'eb-garamond',
  'lora',
] as const;

export type FontId = (typeof FONT_IDS)[number];

export interface FontDefinition {
  id: FontId;
  /** Human readable name shown in the UI. */
  name: string;
  /** CSS family name declared by the fontsource package. */
  family: string;
  /** Fallback stack used while the font loads or if it fails. */
  fallback: string;
  category: 'sans' | 'serif';
  /** npm package providing the font files. */
  packageName: string;
}

export const FONTS: Record<FontId, FontDefinition> = {
  archivo: {
    id: 'archivo',
    name: 'Archivo',
    family: 'Archivo Variable',
    fallback: "'Helvetica Neue', Arial, sans-serif",
    category: 'sans',
    packageName: '@fontsource-variable/archivo',
  },
  inter: {
    id: 'inter',
    name: 'Inter',
    family: 'Inter Variable',
    fallback: "'Helvetica Neue', Arial, sans-serif",
    category: 'sans',
    packageName: '@fontsource-variable/inter',
  },
  'ibm-plex-sans': {
    id: 'ibm-plex-sans',
    name: 'IBM Plex Sans',
    family: 'IBM Plex Sans Variable',
    fallback: "'Helvetica Neue', Arial, sans-serif",
    category: 'sans',
    packageName: '@fontsource-variable/ibm-plex-sans',
  },
  'source-sans-3': {
    id: 'source-sans-3',
    name: 'Source Sans 3',
    family: 'Source Sans 3 Variable',
    fallback: "'Helvetica Neue', Arial, sans-serif",
    category: 'sans',
    packageName: '@fontsource-variable/source-sans-3',
  },
  roboto: {
    id: 'roboto',
    name: 'Roboto',
    family: 'Roboto Variable',
    fallback: 'Arial, sans-serif',
    category: 'sans',
    packageName: '@fontsource-variable/roboto',
  },
  'source-serif-4': {
    id: 'source-serif-4',
    name: 'Source Serif 4',
    family: 'Source Serif 4 Variable',
    fallback: "Georgia, 'Times New Roman', serif",
    category: 'serif',
    packageName: '@fontsource-variable/source-serif-4',
  },
  'eb-garamond': {
    id: 'eb-garamond',
    name: 'EB Garamond',
    family: 'EB Garamond Variable',
    fallback: "Garamond, Georgia, 'Times New Roman', serif",
    category: 'serif',
    packageName: '@fontsource-variable/eb-garamond',
  },
  lora: {
    id: 'lora',
    name: 'Lora',
    family: 'Lora Variable',
    fallback: "Georgia, 'Times New Roman', serif",
    category: 'serif',
    packageName: '@fontsource-variable/lora',
  },
};

export function fontStack(id: FontId): string {
  const font = FONTS[id] ?? FONTS.archivo;
  return `'${font.family}', ${font.fallback}`;
}
