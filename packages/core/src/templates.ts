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
    colors: {
      text: '#1a1a1a',
      secondary: '#5c5c5c',
      accent: '#b4231b',
      divider: '#1a1a1a',
      paper: '#ffffff',
    },
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
    colors: {
      text: '#1d2430',
      secondary: '#5a6475',
      accent: '#0f6b74',
      divider: '#d4dbe3',
      paper: '#ffffff',
    },
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
    colors: {
      text: '#111111',
      secondary: '#4a4a4a',
      accent: '#111111',
      divider: '#111111',
      paper: '#ffffff',
    },
    header: { alignment: 'center', contactLayout: 'auto', showHeadline: true },
    dateFormat: 'short',
    bulletStyle: 'dash',
  },
};

const claude: TemplateDefinition = {
  id: 'claude',
  name: 'Forge Claude',
  description:
    'Warm ivory paper, an editorial serif and a clay accent, after Claude\u2019s design language.',
  highlights: ['Serif display headings', 'Ivory paper, clay accent', 'Calm, generous rhythm'],
  supportsAccent: true,
  defaults: {
    page: {
      format: 'A4',
      orientation: 'portrait',
      margins: { top: 18, right: 19, bottom: 18, left: 19 },
      pageNumbers: false,
    },
    typography: {
      bodyFont: 'inter',
      headingFont: 'source-serif-4',
      baseSize: 9.5,
      sectionTitleSize: 13,
      entryTitleSize: 10.5,
      nameSize: 30,
      lineHeight: 1.5,
      letterSpacing: -0.003,
      nameWeight: 500,
    },
    spacing: { section: 16, entry: 9, paragraph: 2.5, header: 14 },
    colors: {
      text: '#141413',
      secondary: '#5e5d59',
      accent: '#b5532f',
      divider: '#e3dacc',
      paper: '#faf9f5',
    },
    header: { alignment: 'left', contactLayout: 'auto', showHeadline: true },
    dateFormat: 'short',
    bulletStyle: 'dash',
  },
};

const swiss: TemplateDefinition = {
  id: 'swiss',
  name: 'Forge Swiss',
  description: 'International style: headings hang in a left column beside the content.',
  highlights: ['Hanging section headings', 'Strict grid', 'One bold red accent'],
  supportsAccent: true,
  defaults: {
    page: {
      format: 'A4',
      orientation: 'portrait',
      margins: { top: 16, right: 16, bottom: 16, left: 16 },
      pageNumbers: false,
    },
    typography: {
      bodyFont: 'ibm-plex-sans',
      headingFont: 'ibm-plex-sans',
      baseSize: 9.25,
      sectionTitleSize: 8.5,
      entryTitleSize: 10,
      nameSize: 32,
      lineHeight: 1.45,
      letterSpacing: 0,
      nameWeight: 700,
    },
    spacing: { section: 13, entry: 8, paragraph: 2, header: 14 },
    colors: {
      text: '#111111',
      secondary: '#555555',
      accent: '#d0021b',
      divider: '#111111',
      paper: '#ffffff',
    },
    header: { alignment: 'left', contactLayout: 'auto', showHeadline: true },
    dateFormat: 'numeric',
    bulletStyle: 'square',
  },
};

const studio: TemplateDefinition = {
  id: 'studio',
  name: 'Forge Studio',
  description: 'A full-bleed colour band for the header, then clean, confident sections.',
  highlights: ['Colour header band', 'Accent section markers', 'Modern sans typography'],
  supportsAccent: true,
  defaults: {
    page: {
      format: 'A4',
      orientation: 'portrait',
      margins: { top: 16, right: 17, bottom: 16, left: 17 },
      pageNumbers: false,
    },
    typography: {
      bodyFont: 'inter',
      headingFont: 'inter',
      baseSize: 9.5,
      sectionTitleSize: 10.5,
      entryTitleSize: 10.25,
      nameSize: 28,
      lineHeight: 1.5,
      letterSpacing: -0.005,
      nameWeight: 700,
    },
    spacing: { section: 14, entry: 9, paragraph: 2.5, header: 16 },
    colors: {
      text: '#1b2230',
      secondary: '#55607a',
      accent: '#1e3a5f',
      divider: '#d5dce6',
      paper: '#ffffff',
    },
    header: { alignment: 'left', contactLayout: 'auto', showHeadline: true },
    dateFormat: 'short',
    bulletStyle: 'disc',
  },
};

const executive: TemplateDefinition = {
  id: 'executive',
  name: 'Forge Executive',
  description: 'Traditional and formal: Garamond, a centred letterspaced name and double rules.',
  highlights: ['Garamond typography', 'Centred formal header', 'Small-caps headings'],
  supportsAccent: true,
  defaults: {
    page: {
      format: 'A4',
      orientation: 'portrait',
      margins: { top: 18, right: 20, bottom: 18, left: 20 },
      pageNumbers: false,
    },
    typography: {
      bodyFont: 'eb-garamond',
      headingFont: 'eb-garamond',
      baseSize: 11,
      sectionTitleSize: 12,
      entryTitleSize: 11.5,
      nameSize: 24,
      lineHeight: 1.35,
      letterSpacing: 0,
      nameWeight: 500,
    },
    spacing: { section: 13, entry: 8, paragraph: 2, header: 12 },
    colors: {
      text: '#111111',
      secondary: '#4d4d4d',
      accent: '#1f2a44',
      divider: '#1f2a44',
      paper: '#ffffff',
    },
    header: { alignment: 'center', contactLayout: 'single-line', showHeadline: true },
    dateFormat: 'long',
    bulletStyle: 'disc',
  },
};

export const TEMPLATES: Record<TemplateId, TemplateDefinition> = {
  classic,
  modern,
  minimal,
  claude,
  swiss,
  studio,
  executive,
};

export const TEMPLATE_LIST: TemplateDefinition[] = [
  classic,
  modern,
  minimal,
  claude,
  swiss,
  studio,
  executive,
];
