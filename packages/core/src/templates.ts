import type { DocumentSettings, TemplateId } from './schema';

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  highlights: string[];
  /** Whether colour controls beyond text colour are meaningful. */
  supportsAccent: boolean;
  defaults: DocumentSettings;
}

const classic: TemplateDefinition = {
  id: 'classic',
  name: 'Forge Classic',
  description: 'Dense, black-on-white and built for applicant tracking systems.',
  highlights: ['ATS-first structure', 'Ruled section headings', 'High information density'],
  supportsAccent: true,
  defaults: {
    page: {
      format: 'A4',
      orientation: 'portrait',
      margins: { top: 14, right: 15, bottom: 14, left: 15 },
      pageNumbers: false,
    },
    typography: {
      bodyFont: 'archivo',
      headingFont: 'archivo',
      baseSize: 9.75,
      sectionTitleSize: 8,
      entryTitleSize: 10.25,
      nameSize: 28,
      lineHeight: 1.42,
      letterSpacing: 0,
      nameWeight: 700,
    },
    spacing: { section: 11, entry: 7, paragraph: 2, header: 10 },
    colors: { text: '#1a1a1a', secondary: '#5c5c5c', accent: '#b4231b', divider: '#1a1a1a' },
    header: { alignment: 'left', contactLayout: 'auto', showHeadline: true },
    dateFormat: 'year',
    bulletStyle: 'disc',
  },
};

const modern: TemplateDefinition = {
  id: 'modern',
  name: 'Forge Modern',
  description: 'Generous whitespace, a quiet accent colour and contemporary type.',
  highlights: ['Accent-coloured hierarchy', 'Airier rhythm', 'Inter typography'],
  supportsAccent: true,
  defaults: {
    page: {
      format: 'A4',
      orientation: 'portrait',
      margins: { top: 18, right: 18, bottom: 18, left: 18 },
      pageNumbers: false,
    },
    typography: {
      bodyFont: 'inter',
      headingFont: 'inter',
      baseSize: 9.5,
      sectionTitleSize: 11,
      entryTitleSize: 10.25,
      nameSize: 26,
      lineHeight: 1.5,
      letterSpacing: -0.005,
      nameWeight: 700,
    },
    spacing: { section: 15, entry: 9, paragraph: 2.5, header: 14 },
    colors: { text: '#1d2430', secondary: '#5a6475', accent: '#0f6b74', divider: '#d4dbe3' },
    header: { alignment: 'left', contactLayout: 'auto', showHeadline: true },
    dateFormat: 'short',
    bulletStyle: 'disc',
  },
};

const minimal: TemplateDefinition = {
  id: 'minimal',
  name: 'Forge Minimal',
  description: 'Typography does all the work. No rules, no colour, no noise.',
  highlights: ['Serif typography', 'Centred header', 'Pure black and white'],
  supportsAccent: false,
  defaults: {
    page: {
      format: 'A4',
      orientation: 'portrait',
      margins: { top: 18, right: 20, bottom: 18, left: 20 },
      pageNumbers: false,
    },
    typography: {
      bodyFont: 'source-serif-4',
      headingFont: 'source-serif-4',
      baseSize: 10,
      sectionTitleSize: 10,
      entryTitleSize: 10.5,
      nameSize: 24,
      lineHeight: 1.45,
      letterSpacing: 0,
      nameWeight: 600,
    },
    spacing: { section: 14, entry: 8, paragraph: 2, header: 12 },
    colors: { text: '#111111', secondary: '#4a4a4a', accent: '#111111', divider: '#111111' },
    header: { alignment: 'center', contactLayout: 'auto', showHeadline: true },
    dateFormat: 'short',
    bulletStyle: 'dash',
  },
};

export const TEMPLATES: Record<TemplateId, TemplateDefinition> = { classic, modern, minimal };

export const TEMPLATE_LIST: TemplateDefinition[] = [classic, modern, minimal];
